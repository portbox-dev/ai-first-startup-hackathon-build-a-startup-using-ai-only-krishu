import { supabase, isSupabaseConfigured } from './client';
import { RestaurantInfo, Dish, Category } from '../types';
import { AnalyticsEvent, getStoredEvents } from '../data/analyticsStore';
import { DatabaseRestaurant, DatabaseCategory, DatabaseDish } from './types';
import type { User } from '@supabase/supabase-js';

export interface MigrationSummary {
  restaurantId: string;
  dishesCount: number;
  categoriesCount: number;
  analyticsCount: number;
  slug: string;
}

/**
 * Fetch a published restaurant and its complete digital menu from Supabase by slug.
 * Safe for public customers (uses anon key, respects RLS).
 */
export interface PublishedMenuResult {
  success: boolean;
  restaurant: RestaurantInfo | null;
  restaurantId: string | null;
  slug: string | null;
  categories: Category[];
  dishes: Dish[];
  error?: string;
}

const isUUID = (str: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str.trim());
};

/**
 * Fetch a published restaurant and its complete digital menu from Supabase.
 * Safe for public customers (uses anon key, respects RLS).
 * Supports lookup by slug, UUID, or resolves the latest published restaurant if none specified.
 */
export async function fetchPublishedMenuFromCloud(identifier?: string): Promise<PublishedMenuResult> {
  if (!supabase || !isSupabaseConfigured) {
    return {
      success: false,
      restaurant: null,
      restaurantId: null,
      slug: null,
      categories: [],
      dishes: [],
      error: 'Supabase is not configured',
    };
  }

  try {
    // Only query customer-facing restaurant fields (do NOT expose private credentials or owner auth UUID)
    const cleanIdent = identifier?.trim();

    let restData: DatabaseRestaurant | null = null;
    let restErr: { message: string } | null = null;

    if (cleanIdent) {
      // 1. UUID lookup
      if (isUUID(cleanIdent)) {
        const res = await supabase
          .from('restaurants')
          .select('id, name, slug, tagline, cuisine, city, address, opening_hours, wifi_ssid, rating, reviews_count')
          .eq('is_published', true)
          .eq('id', cleanIdent)
          .maybeSingle();
        restData = (res.data as unknown) as DatabaseRestaurant | null;
        restErr = res.error;
      }

      // 2. Exact slug lookup (case-insensitive)
      if (!restData) {
        const res = await supabase
          .from('restaurants')
          .select('id, name, slug, tagline, cuisine, city, address, opening_hours, wifi_ssid, rating, reviews_count')
          .eq('is_published', true)
          .eq('slug', cleanIdent.toLowerCase())
          .maybeSingle();
        restData = (res.data as unknown) as DatabaseRestaurant | null;
        restErr = res.error;
      }

      // 3. Normalized slug variants (e.g. "Green Leaf Café" -> "green-leaf-cafe", "green-leaf-caf")
      if (!restData) {
        const normalized = cleanIdent
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        const candidateSlugs = Array.from(new Set([
          normalized,
          normalized.replace(/-cafe$/, '-caf'),
          normalized + 'e',
          normalized.replace(/-caf$/, '-cafe'),
        ])).filter(Boolean);

        const res = await supabase
          .from('restaurants')
          .select('id, name, slug, tagline, cuisine, city, address, opening_hours, wifi_ssid, rating, reviews_count')
          .eq('is_published', true)
          .in('slug', candidateSlugs)
          .limit(1)
          .maybeSingle();

        if (res.data) {
          restData = (res.data as unknown) as DatabaseRestaurant;
          restErr = null;
        }
      }

      // 4. Name match (case-insensitive)
      if (!restData) {
        const res = await supabase
          .from('restaurants')
          .select('id, name, slug, tagline, cuisine, city, address, opening_hours, wifi_ssid, rating, reviews_count')
          .eq('is_published', true)
          .ilike('name', `%${cleanIdent}%`)
          .limit(1)
          .maybeSingle();

        if (res.data) {
          restData = (res.data as unknown) as DatabaseRestaurant;
          restErr = null;
        }
      }

      // 5. Prefix search on slug
      if (!restData) {
        const prefix = cleanIdent
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/[-_]cafe$|[-_]caf$/i, '')
          .replace(/^-|-$/g, '');

        if (prefix && prefix.length >= 3) {
          const res = await supabase
            .from('restaurants')
            .select('id, name, slug, tagline, cuisine, city, address, opening_hours, wifi_ssid, rating, reviews_count')
            .eq('is_published', true)
            .ilike('slug', `${prefix}%`)
            .limit(1)
            .maybeSingle();

          if (res.data) {
            restData = (res.data as unknown) as DatabaseRestaurant;
            restErr = null;
          }
        }
      }
    }

    // 6. Safe Fallback: If still not found, or if no identifier provided, take the primary published restaurant
    if (!restData) {
      const res = await supabase
        .from('restaurants')
        .select('id, name, slug, tagline, cuisine, city, address, opening_hours, wifi_ssid, rating, reviews_count')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (res.data) {
        restData = (res.data as unknown) as DatabaseRestaurant;
        restErr = null;
      }
    }

    if (restErr || !restData) {
      return {
        success: false,
        restaurant: null,
        restaurantId: null,
        slug: null,
        categories: [],
        dishes: [],
        error: restErr?.message || (cleanIdent ? `Published restaurant "${cleanIdent}" not found` : 'No published restaurant found'),
      };
    }

    const restaurant: RestaurantInfo = {
      name: restData.name,
      tagline: restData.tagline || '',
      cuisine: restData.cuisine || '',
      city: restData.city || '',
      address: restData.address || '',
      openingHours: restData.opening_hours || '',
      tableCount: 10,
      wifiSsid: restData.wifi_ssid || '',
      wifiPass: '', // Private field omitted from public customer menu responses
      rating: Number(restData.rating) || 4.9,
      reviewsCount: restData.reviews_count || 0,
      currencySymbol: '₹',
      slug: restData.slug,
      ownerId: undefined, // Private authentication UUID omitted from public responses
      id: restData.id,
    };

    // 2. Fetch categories for this restaurant
    const { data: catData } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restData.id)
      .order('sort_order', { ascending: true });

    const categories: Category[] = (catData || []).map((c: DatabaseCategory) => ({
      id: c.id,
      name: c.name,
      description: c.description || c.name,
    }));

    // 3. Fetch dishes for this restaurant
    const { data: dishData } = await supabase
      .from('dishes')
      .select('*')
      .eq('restaurant_id', restData.id)
      .order('created_at', { ascending: false });

    const dishes: Dish[] = (dishData || []).map((d: DatabaseDish) => ({
      id: d.id,
      name: d.name,
      category: d.category_id,
      price: Number(d.price),
      description: d.description || '',
      image: d.image || undefined,
      isAvailable: d.is_available,
      dietaryType: d.dietary_type,
      isVegan: d.is_vegan,
      isGlutenFree: d.is_gluten_free,
      spiceLevel: typeof d.spice_level === 'number' && d.spice_level >= 0 && d.spice_level <= 3 ? (d.spice_level as 0 | 1 | 2 | 3) : 1,
      prepTime: d.prep_time || '12 mins',
      calories: d.calories || undefined,
      tags: d.tags || [],
    }));

    return {
      success: true,
      restaurant,
      restaurantId: restData.id,
      slug: restData.slug,
      categories,
      dishes,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      restaurant: null,
      restaurantId: null,
      slug: null,
      categories: [],
      dishes: [],
      error: errorMsg,
    };
  }
}

/**
 * Check if the currently authenticated user has an active restaurant profile in Supabase
 */
export async function getOwnerRestaurants(userId: string): Promise<DatabaseRestaurant[]> {
  if (!supabase || !isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.warn('Could not query user restaurants:', error);
    return [];
  }

  return data as DatabaseRestaurant[];
}

export interface CloudTableCounts {
  restaurants: number | null;
  restaurant_members: number | null;
  categories: number | null;
  dishes: number | null;
  menu_analytics_events: number | null;
  error?: string;
}

/**
 * Fetch live table row counts directly from Supabase (safe HEAD-only queries)
 */
export async function fetchCloudTableCounts(): Promise<CloudTableCounts> {
  const result: CloudTableCounts = {
    restaurants: null,
    restaurant_members: null,
    categories: null,
    dishes: null,
    menu_analytics_events: null,
  };

  if (!supabase || !isSupabaseConfigured) return result;

  try {
    const [r, rm, c, d, a] = await Promise.all([
      supabase.from('restaurants').select('*', { count: 'exact', head: true }),
      supabase.from('restaurant_members').select('*', { count: 'exact', head: true }),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase.from('dishes').select('*', { count: 'exact', head: true }),
      supabase.from('menu_analytics_events').select('*', { count: 'exact', head: true }),
    ]);

    result.restaurants = r.count ?? (r.error ? null : 0);
    result.restaurant_members = rm.count ?? (rm.error ? null : 0);
    result.categories = c.count ?? (c.error ? null : 0);
    result.dishes = d.count ?? (d.error ? null : 0);
    result.menu_analytics_events = a.count ?? (a.error ? null : 0);
  } catch (err: unknown) {
    result.error = err instanceof Error ? err.message : String(err);
  }

  return result;
}

/**
 * Explicit migration tool:
 * Migrates local prototype data (restaurant, dishes, categories, analytics)
 * to a multi-tenant Supabase database for an authenticated user.
 *
 * SAFETY GUARANTEE: Does NOT overwrite or clear browser localStorage.
 */
export async function migrateLocalDataToCloud(
  user: User,
  localRestaurant: RestaurantInfo,
  localDishes: Dish[],
  localCategories: Category[],
  onProgress?: (step: string, details?: string) => void
): Promise<{ success: boolean; summary?: MigrationSummary; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return {
      success: false,
      error: 'Supabase client is not configured. Add environment variables first.',
    };
  }

  try {
    onProgress?.('Initializing migration', 'verifying account credentials');

    // Generate clean slug from restaurant name (e.g. "green-leaf-cafe")
    const cleanSlug = localRestaurant.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'my-restaurant';

    let restaurantId: string;
    let actualSlug = cleanSlug;

    // 1. Prevent duplicate restaurants: Check if this user already owns a restaurant in Supabase
    onProgress?.('Checking existing cloud profiles', `checking owner ${user.email}`);
    const { data: existingUserRestaurants, error: queryErr } = await supabase
      .from('restaurants')
      .select('id, slug, name')
      .eq('owner_id', user.id);

    if (queryErr) {
      console.warn('Notice while checking existing restaurants:', queryErr.message);
    }

    const matchedRestaurant = existingUserRestaurants?.find(
      (r) => r.slug === cleanSlug || r.name.toLowerCase() === localRestaurant.name.toLowerCase()
    );

    if (matchedRestaurant) {
      restaurantId = matchedRestaurant.id;
      actualSlug = matchedRestaurant.slug;

      onProgress?.('Updating restaurant profile', `updating "${localRestaurant.name}"`);
      // Update existing restaurant profile
      const { error: updateErr } = await supabase
        .from('restaurants')
        .update({
          name: localRestaurant.name,
          tagline: localRestaurant.tagline,
          cuisine: localRestaurant.cuisine,
          city: localRestaurant.city,
          address: localRestaurant.address,
          opening_hours: localRestaurant.openingHours,
          wifi_ssid: localRestaurant.wifiSsid,
          wifi_pass: localRestaurant.wifiPass,
          rating: localRestaurant.rating || 4.9,
          reviews_count: localRestaurant.reviewsCount || 320,
          is_published: true,
        })
        .eq('id', restaurantId);

      if (updateErr) {
        return {
          success: false,
          error: `Failed to update existing restaurant profile: ${updateErr.message}`,
        };
      }
    } else {
      onProgress?.('Creating restaurant profile', `inserting "${localRestaurant.name}"`);
      // Create new restaurant profile, ensuring slug uniqueness
      const { data: slugCheck } = await supabase
        .from('restaurants')
        .select('id')
        .eq('slug', cleanSlug)
        .maybeSingle();

      if (slugCheck) {
        actualSlug = `${cleanSlug}-${Date.now().toString().slice(-4)}`;
      }

      const { data: restaurantRow, error: restErr } = await supabase
        .from('restaurants')
        .insert({
          owner_id: user.id,
          name: localRestaurant.name,
          slug: actualSlug,
          tagline: localRestaurant.tagline,
          cuisine: localRestaurant.cuisine,
          city: localRestaurant.city,
          address: localRestaurant.address,
          opening_hours: localRestaurant.openingHours,
          wifi_ssid: localRestaurant.wifiSsid,
          wifi_pass: localRestaurant.wifiPass,
          rating: localRestaurant.rating || 4.9,
          reviews_count: localRestaurant.reviewsCount || 320,
          is_published: true,
        })
        .select('id')
        .single();

      if (restErr || !restaurantRow) {
        return {
          success: false,
          error: `Failed to create restaurant: ${restErr?.message || 'Unknown database error'} (Code: ${restErr?.code || 'none'})`,
        };
      }

      restaurantId = restaurantRow.id;
    }

    // 2. Add owner membership (idempotent upsert)
    onProgress?.('Setting owner membership', 'linking owner role in restaurant_members');
    const { error: memberErr } = await supabase.from('restaurant_members').upsert({
      restaurant_id: restaurantId,
      user_id: user.id,
      role: 'owner',
    }, { onConflict: 'restaurant_id,user_id' });

    if (memberErr) {
      console.warn('Notice while setting restaurant_members:', memberErr.message);
    }

    // 3. Upsert categories
    if (localCategories.length > 0) {
      onProgress?.('Syncing menu categories', `${localCategories.length} categories`);
      const categoryRows = localCategories.map((cat, idx) => ({
        id: cat.id,
        restaurant_id: restaurantId,
        name: cat.name,
        description: cat.description || '',
        icon_name: 'Utensils',
        sort_order: idx,
      }));

      const { error: catErr } = await supabase
        .from('categories')
        .upsert(categoryRows, { onConflict: 'restaurant_id,id' });

      if (catErr) {
        return {
          success: false,
          error: `Failed to migrate categories: ${catErr.message} (Code: ${catErr.code || 'none'})`,
        };
      }
    }

    // 4. Upsert dishes
    if (localDishes.length > 0) {
      onProgress?.('Syncing dishes & recipes', `${localDishes.length} dishes`);
      const dishRows = localDishes.map((dish) => ({
        id: dish.id,
        restaurant_id: restaurantId,
        category_id: dish.category,
        name: dish.name,
        price: dish.price,
        description: dish.description,
        image: dish.image || null,
        is_available: dish.isAvailable,
        dietary_type: dish.dietaryType || (dish.isVegan ? 'vegan' : 'vegetarian'),
        is_vegan: dish.isVegan || false,
        is_gluten_free: dish.isGlutenFree || false,
        spice_level: dish.spiceLevel ?? 1,
        prep_time: dish.prepTime || '12 mins',
        calories: dish.calories || null,
        tags: dish.tags || [],
      }));

      const { error: dishErr } = await supabase
        .from('dishes')
        .upsert(dishRows, { onConflict: 'restaurant_id,id' });

      if (dishErr) {
        return {
          success: false,
          error: `Failed to migrate dishes: ${dishErr.message} (Code: ${dishErr.code || 'none'})`,
        };
      }
    }

    // 5. Migrate recorded analytics events safely (prevent duplicates)
    onProgress?.('Migrating analytics history', 'safe engagement event transfer');
    const localEvents = getStoredEvents(localRestaurant.name);
    let migratedEventsCount = 0;

    if (localEvents.length > 0) {
      const { data: existingEvents } = await supabase
        .from('menu_analytics_events')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('session_id', 'migrated-session');

      if (!existingEvents || existingEvents.length === 0) {
        const eventRows = localEvents.map((evt) => ({
          restaurant_id: restaurantId,
          event_type: evt.type,
          target_id: evt.targetId || null,
          target_name: evt.targetName || '',
          session_id: 'migrated-session',
          metadata: { category: evt.category || null },
          created_at: new Date(evt.timestamp).toISOString(),
        }));

        const { error: eventErr } = await supabase
          .from('menu_analytics_events')
          .insert(eventRows);

        if (!eventErr) {
          migratedEventsCount = eventRows.length;
        }
      } else {
        migratedEventsCount = existingEvents.length;
      }
    }

    // 6. Post-migration verification of record counts
    onProgress?.('Verifying cloud storage', 'querying counts in Supabase database');
    const { data: verifiedDishes } = await supabase
      .from('dishes')
      .select('id')
      .eq('restaurant_id', restaurantId);

    const { data: verifiedCategories } = await supabase
      .from('categories')
      .select('id')
      .eq('restaurant_id', restaurantId);

    const actualDishesCount = verifiedDishes?.length || 0;
    const actualCategoriesCount = verifiedCategories?.length || 0;

    if (actualDishesCount < localDishes.length) {
      return {
        success: false,
        error: `Partial migration warning: Expected ${localDishes.length} dishes, but only ${actualDishesCount} were verified in Supabase.`,
      };
    }

    onProgress?.('Migration complete', `${actualDishesCount} dishes verified`);

    return {
      success: true,
      summary: {
        restaurantId,
        dishesCount: actualDishesCount,
        categoriesCount: actualCategoriesCount,
        analyticsCount: migratedEventsCount,
        slug: actualSlug,
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}

/**
 * Save or update a restaurant profile in Supabase for the authenticated owner
 */
export async function saveRestaurantProfile(
  restaurantData: RestaurantInfo,
  user: User,
  existingRestaurantId?: string
): Promise<{ success: boolean; restaurantId?: string; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const cleanSlug = restaurantData.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'my-restaurant';

    const payload = {
      owner_id: user.id,
      name: restaurantData.name,
      slug: cleanSlug,
      tagline: restaurantData.tagline,
      cuisine: restaurantData.cuisine,
      city: restaurantData.city,
      address: restaurantData.address,
      opening_hours: restaurantData.openingHours,
      wifi_ssid: restaurantData.wifiSsid,
      wifi_pass: restaurantData.wifiPass,
      rating: restaurantData.rating || 4.9,
      reviews_count: restaurantData.reviewsCount || 320,
      is_published: true,
    };

    if (existingRestaurantId) {
      const { error } = await supabase
        .from('restaurants')
        .update(payload)
        .eq('id', existingRestaurantId)
        .eq('owner_id', user.id);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, restaurantId: existingRestaurantId };
    } else {
      const { data, error } = await supabase
        .from('restaurants')
        .insert(payload)
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, restaurantId: data?.id };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}

/**
 * Save or update a dish in Supabase
 */
export async function saveDishToCloud(
  dish: Dish,
  restaurantId?: string | null
): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    let targetRestId = restaurantId;
    if (!targetRestId) {
      targetRestId = localStorage.getItem('smartmenu_cloud_restaurant_id') || null;
    }
    if (!targetRestId) {
      const { data: pubRest } = await supabase
        .from('restaurants')
        .select('id')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      targetRestId = pubRest?.id || null;
    }

    if (!targetRestId) {
      return { success: false, error: 'No active restaurant ID available for cloud save' };
    }

    const dishRow = {
      id: dish.id,
      restaurant_id: targetRestId,
      category_id: dish.category,
      name: dish.name,
      price: dish.price,
      description: dish.description,
      image: dish.image || null,
      is_available: dish.isAvailable,
      dietary_type: dish.dietaryType || (dish.isVegan ? 'vegan' : 'vegetarian'),
      is_vegan: dish.isVegan || false,
      is_gluten_free: dish.isGlutenFree || false,
      spice_level: dish.spiceLevel ?? 1,
      prep_time: dish.prepTime || '12 mins',
      calories: dish.calories || null,
      tags: dish.tags || [],
    };

    const { error } = await supabase
      .from('dishes')
      .upsert(dishRow, { onConflict: 'restaurant_id,id' });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}

/**
 * Delete a dish in Supabase
 */
export async function deleteDishFromCloud(
  dishId: string,
  restaurantId?: string | null
): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    let targetRestId = restaurantId;
    if (!targetRestId) {
      targetRestId = localStorage.getItem('smartmenu_cloud_restaurant_id') || null;
    }
    if (!targetRestId) {
      const { data: pubRest } = await supabase
        .from('restaurants')
        .select('id')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      targetRestId = pubRest?.id || null;
    }

    if (!targetRestId) {
      return { success: false, error: 'No active restaurant ID available for cloud deletion' };
    }

    const { error } = await supabase
      .from('dishes')
      .delete()
      .eq('id', dishId)
      .eq('restaurant_id', targetRestId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}

/**
 * Load the active owner's restaurant and dishes from Supabase
 */
export async function loadOwnerRestaurantWithMenu(
  userId: string
): Promise<{
  success: boolean;
  restaurant?: RestaurantInfo;
  restaurantId?: string;
  categories?: Category[];
  dishes?: Dish[];
  error?: string;
}> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    // 1. Get restaurant
    const { data: restList, error: restErr } = await supabase
      .from('restaurants')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (restErr) {
      return { success: false, error: restErr.message };
    }

    if (!restList || restList.length === 0) {
      return { success: true }; // User has no restaurant in cloud yet
    }

    const restData = restList[0];
    const restaurantId = restData.id;

    const restaurant: RestaurantInfo = {
      name: restData.name,
      tagline: restData.tagline || '',
      cuisine: restData.cuisine || '',
      city: restData.city || '',
      address: restData.address || '',
      openingHours: restData.opening_hours || '',
      tableCount: 10,
      wifiSsid: restData.wifi_ssid || '',
      wifiPass: restData.wifi_pass || '',
      rating: Number(restData.rating) || 4.9,
      reviewsCount: restData.reviews_count || 0,
      currencySymbol: '₹',
      slug: restData.slug,
      ownerId: restData.owner_id,
      id: restData.id,
    };

    // 2. Get categories
    const { data: catData } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('sort_order', { ascending: true });

    const categories: Category[] = (catData || []).map((c: DatabaseCategory) => ({
      id: c.id,
      name: c.name,
      description: c.description || c.name,
    }));

    // 3. Get dishes
    const { data: dishData } = await supabase
      .from('dishes')
      .select('*')
      .eq('restaurant_id', restaurantId);

    const dishes: Dish[] = (dishData || []).map((d: DatabaseDish) => ({
      id: d.id,
      name: d.name,
      category: d.category_id,
      price: Number(d.price),
      description: d.description || '',
      image: d.image || undefined,
      isAvailable: d.is_available,
      dietaryType: d.dietary_type,
      isVegan: d.is_vegan,
      isGlutenFree: d.is_gluten_free,
      spiceLevel: typeof d.spice_level === 'number' && d.spice_level >= 0 && d.spice_level <= 3 ? (d.spice_level as 0 | 1 | 2 | 3) : 1,
      prepTime: d.prep_time || '12 mins',
      calories: d.calories || undefined,
      tags: d.tags || [],
    }));

    return {
      success: true,
      restaurant,
      restaurantId,
      categories: categories.length > 0 ? categories : undefined,
      dishes: dishes.length > 0 ? dishes : undefined,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}

