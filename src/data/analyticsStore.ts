/**
 * Menu Engagement Analytics Store
 * Stores customer interaction events with dual-layer architecture:
 * 1. Immediate local browser storage (offline resilience and instant UI updates).
 * 2. Asynchronous Supabase cloud sync to 'menu_analytics_events' table for live multi-tenant analytics.
 */

import { supabase, isSupabaseConfigured } from '../supabase/client';

export interface AnalyticsEvent {
  id: string;
  restaurantId: string;
  type: 'menu_visit' | 'dish_view' | 'category_select' | 'search';
  targetId?: string;
  targetName?: string;
  category?: string;
  timestamp: number;
  cloudStatus?: 'success' | 'failed' | 'skipped';
  cloudError?: string;
}

export interface AnalyticsTrackingResult {
  id: string;
  eventType: 'menu_visit' | 'dish_view' | 'search' | 'category_select';
  targetName: string;
  targetId?: string | null;
  localSuccess: boolean;
  cloudStatus: 'success' | 'failed' | 'skipped';
  cloudError?: string | null;
  restaurantId?: string | null;
  timestamp: number;
}

export interface DishEngagement {
  id: string;
  name: string;
  category?: string;
  views: number;
}

export interface SearchEngagement {
  term: string;
  count: number;
}

export interface CategoryEngagement {
  id: string;
  name: string;
  views: number;
}

export interface EngagementSummary {
  totalVisits: number;
  totalDishViews: number;
  totalSearches: number;
  totalCategoryClicks: number;
  mostViewedDishes: DishEngagement[];
  popularSearches: SearchEngagement[];
  mostViewedCategories: CategoryEngagement[];
  recentEvents: AnalyticsEvent[];
  lastUpdated: number | null;
  hasRecordedData: boolean;
}

const isUUID = (str: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str.trim());
};

/**
 * Returns a persistent anonymous customer session ID for the current browser tab session
 */
export const getAnonymousSessionId = (): string => {
  try {
    let sessId = sessionStorage.getItem('sm_anon_session_id');
    if (!sessId) {
      sessId = `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem('sm_anon_session_id', sessId);
    }
    return sessId;
  } catch {
    return `anon_${Date.now()}`;
  }
};

let cachedCloudRestaurantId: string | null = null;

/**
 * Resolves the active published restaurant's Supabase UUID.
 * 1. Checks explicit parameter.
 * 2. Checks in-memory cache.
 * 3. Checks localStorage.
 * 4. Resolves from Supabase by slug or published status (using public anon client).
 */
export const resolveCloudRestaurantId = async (
  restaurantName: string,
  providedId?: string | null
): Promise<string | null> => {
  // 1. Explicit valid UUID provided
  if (providedId && isUUID(providedId)) {
    cachedCloudRestaurantId = providedId;
    try {
      localStorage.setItem('smartmenu_cloud_restaurant_id', providedId);
    } catch {
      // ignore storage errors
    }
    return providedId;
  }

  // 2. Memory cache
  if (cachedCloudRestaurantId && isUUID(cachedCloudRestaurantId)) {
    return cachedCloudRestaurantId;
  }

  // 3. LocalStorage cache
  try {
    const saved = localStorage.getItem('smartmenu_cloud_restaurant_id');
    if (saved && isUUID(saved)) {
      cachedCloudRestaurantId = saved;
      return saved;
    }
  } catch {
    // ignore
  }

  // 4. Resolve from Supabase public restaurants table
  if (supabase && isSupabaseConfigured) {
    try {
      const cleanSlug = (restaurantName || 'green-leaf-cafe')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'green-leaf-cafe';

      // Match published restaurant by slug
      const { data: bySlug } = await supabase
        .from('restaurants')
        .select('id')
        .eq('slug', cleanSlug)
        .eq('is_published', true)
        .maybeSingle();

      if (bySlug?.id && isUUID(bySlug.id)) {
        cachedCloudRestaurantId = bySlug.id;
        try {
          localStorage.setItem('smartmenu_cloud_restaurant_id', bySlug.id);
        } catch {
          // ignore
        }
        return bySlug.id;
      }

      // Fallback: any published restaurant (for preview mode)
      const { data: anyPublished } = await supabase
        .from('restaurants')
        .select('id')
        .eq('is_published', true)
        .limit(1)
        .maybeSingle();

      if (anyPublished?.id && isUUID(anyPublished.id)) {
        cachedCloudRestaurantId = anyPublished.id;
        try {
          localStorage.setItem('smartmenu_cloud_restaurant_id', anyPublished.id);
        } catch {
          // ignore
        }
        return anyPublished.id;
      }
    } catch (err) {
      console.warn('[SmartMenu Analytics] Could not resolve restaurant UUID from Supabase:', err);
    }
  }

  return null;
};

// In-memory diagnostic log buffer for live UI feedback
const recentDiagnostics: AnalyticsTrackingResult[] = [];
type DiagnosticListener = (diag: AnalyticsTrackingResult) => void;
const diagnosticListeners: Set<DiagnosticListener> = new Set();

export const getRecentDiagnostics = (): AnalyticsTrackingResult[] => {
  return [...recentDiagnostics];
};

export const subscribeToAnalyticsDiagnostics = (listener: DiagnosticListener): (() => void) => {
  diagnosticListeners.add(listener);
  return () => {
    diagnosticListeners.delete(listener);
  };
};

const notifyDiagnostics = (diag: AnalyticsTrackingResult) => {
  recentDiagnostics.unshift(diag);
  if (recentDiagnostics.length > 30) {
    recentDiagnostics.pop();
  }

  // Non-sensitive console diagnostic logging
  const statusUpper = diag.cloudStatus.toUpperCase();
  const errText = diag.cloudError ? ` | Error: ${diag.cloudError}` : '';
  const restText = diag.restaurantId ? ` | UUID: ${diag.restaurantId.slice(0, 8)}...` : ' | No UUID';
  console.log(
    `[SmartMenu Analytics] ${diag.eventType} | "${diag.targetName}" | Local: ${
      diag.localSuccess ? 'OK' : 'FAIL'
    } | Cloud: ${statusUpper}${restText}${errText}`
  );

  diagnosticListeners.forEach((fn) => {
    try {
      fn(diag);
    } catch {
      // ignore
    }
  });
};

/**
 * Dispatch an insert to Supabase menu_analytics_events table
 * CRITICAL REQUIREMENTS:
 * 1. restaurant_id must be a valid UUID of a published restaurant.
 * 2. target_name is NOT NULL in database schema.
 * 3. Never chain .select() on anon inserts, as anon has no SELECT grant/RLS policy.
 */
const dispatchCloudInsert = async (
  restaurantName: string,
  eventType: 'menu_visit' | 'dish_view' | 'search' | 'category_select',
  targetId: string | null,
  targetName: string,
  providedRestaurantId?: string | null,
  metadata?: Record<string, unknown>
): Promise<{ status: 'success' | 'failed' | 'skipped'; error?: string | null; restaurantId?: string | null }> => {
  if (!supabase || !isSupabaseConfigured) {
    return { status: 'skipped', error: 'Supabase client not configured in .env' };
  }

  try {
    const restaurantId = await resolveCloudRestaurantId(restaurantName, providedRestaurantId);
    if (!restaurantId) {
      return {
        status: 'skipped',
        error: 'No published restaurant UUID found in cloud; stored locally only',
      };
    }

    const sessionId = getAnonymousSessionId();

    // Ensure target_name is never empty or null (PostgreSQL NOT NULL constraint)
    const safeTargetName =
      targetName && targetName.trim().length > 0
        ? targetName.trim()
        : (restaurantName || 'Menu Overview');

    const payload = {
      restaurant_id: restaurantId,
      event_type: eventType,
      target_id: targetId || null,
      target_name: safeTargetName,
      session_id: sessionId,
      metadata: metadata || {},
    };

    // CRITICAL: Do NOT append .select() here! Anon clients are permitted to INSERT
    // by policy "Public can record engagement events", but anon has no SELECT permission.
    // Chaining .select() asks PostgREST to return the row, triggering a 42501 permission error.
    const { error } = await supabase
      .from('menu_analytics_events')
      .insert(payload);

    if (error) {
      const formattedError = `${error.message}${error.code ? ` (Code: ${error.code})` : ''}`;
      return { status: 'failed', error: formattedError, restaurantId };
    }

    return { status: 'success', restaurantId };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { status: 'failed', error: errorMsg };
  }
};

const getStorageKey = (restaurantName: string): string => {
  const safeId = (restaurantName || 'green-leaf-cafe')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-');
  return `smartmenu_analytics_${safeId}`;
};

/**
 * Safely read events from localStorage
 */
export const getStoredEvents = (restaurantName: string): AnalyticsEvent[] => {
  try {
    const key = getStorageKey(restaurantName);
    const data = localStorage.getItem(key);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (e) => e && typeof e === 'object' && typeof e.type === 'string' && typeof e.timestamp === 'number'
      );
    }
  } catch (err) {
    console.warn('Could not read menu analytics:', err);
  }
  return [];
};

/**
 * Safely save events to localStorage
 */
const saveEvents = (restaurantName: string, events: AnalyticsEvent[]) => {
  try {
    const key = getStorageKey(restaurantName);
    // Keep max 500 recent events to prevent localStorage overflow
    const trimmed = events.slice(-500);
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('Could not save menu analytics:', err);
  }
};

/**
 * Record a public menu visit
 * Deduplicated per session to avoid counting re-renders
 */
export const recordMenuVisit = (
  restaurantName: string,
  cloudRestaurantId?: string | null,
  metadata?: Record<string, unknown>
) => {
  const now = Date.now();
  const sessionKey = `sm_session_visit_${(restaurantName || 'green-leaf-cafe').toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  try {
    const lastSession = sessionStorage.getItem(sessionKey);
    // If recorded in this browser session in the last 2 minutes, ignore re-renders
    if (lastSession && now - Number(lastSession) < 120000) {
      return;
    }
    sessionStorage.setItem(sessionKey, String(now));
  } catch {
    // ignore sessionStorage errors
  }

  let localSuccess = false;
  const eventId = `evt-visit-${now}-${Math.random().toString(36).slice(2, 6)}`;
  const targetName = restaurantName || 'Menu Overview';

  try {
    const events = getStoredEvents(restaurantName);
    const newEvent: AnalyticsEvent = {
      id: eventId,
      restaurantId: restaurantName,
      type: 'menu_visit',
      targetName,
      timestamp: now,
    };
    saveEvents(restaurantName, [...events, newEvent]);
    localSuccess = true;
  } catch {
    localSuccess = false;
  }

  // Dispatch asynchronous Supabase cloud insert
  dispatchCloudInsert(
    restaurantName,
    'menu_visit',
    null,
    targetName,
    cloudRestaurantId,
    metadata
  ).then((res) => {
    notifyDiagnostics({
      id: eventId,
      eventType: 'menu_visit',
      targetName,
      targetId: null,
      localSuccess,
      cloudStatus: res.status,
      cloudError: res.error,
      restaurantId: res.restaurantId,
      timestamp: now,
    });
  });
};

/**
 * Track last dish view timestamp to avoid double triggers on rapid clicks
 */
let lastDishViewId: string | null = null;
let lastDishViewTime = 0;

/**
 * Record when a customer opens/expands a dish's detail modal
 */
export const recordDishView = (
  restaurantName: string,
  dish: { id: string; name: string; category?: string; price?: number },
  cloudRestaurantId?: string | null
) => {
  if (!dish || !dish.name) return;

  const now = Date.now();
  // Prevent duplicate logs of the same dish within 2.5 seconds
  if (lastDishViewId === dish.id && now - lastDishViewTime < 2500) {
    return;
  }
  lastDishViewId = dish.id;
  lastDishViewTime = now;

  let localSuccess = false;
  const eventId = `evt-dish-${now}-${Math.random().toString(36).slice(2, 6)}`;

  try {
    const events = getStoredEvents(restaurantName);
    const newEvent: AnalyticsEvent = {
      id: eventId,
      restaurantId: restaurantName,
      type: 'dish_view',
      targetId: dish.id,
      targetName: dish.name,
      category: dish.category,
      timestamp: now,
    };
    saveEvents(restaurantName, [...events, newEvent]);
    localSuccess = true;
  } catch {
    localSuccess = false;
  }

  // Dispatch asynchronous Supabase cloud insert
  dispatchCloudInsert(
    restaurantName,
    'dish_view',
    dish.id,
    dish.name,
    cloudRestaurantId,
    { category: dish.category, price: dish.price }
  ).then((res) => {
    notifyDiagnostics({
      id: eventId,
      eventType: 'dish_view',
      targetName: dish.name,
      targetId: dish.id,
      localSuccess,
      cloudStatus: res.status,
      cloudError: res.error,
      restaurantId: res.restaurantId,
      timestamp: now,
    });
  });
};

/**
 * Record when a customer submits or performs a search
 */
export const recordSearch = (
  restaurantName: string,
  query: string,
  cloudRestaurantId?: string | null
) => {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery || cleanQuery.length < 2) return;

  const now = Date.now();
  const events = getStoredEvents(restaurantName);

  // Prevent duplicate logs of identical search queries within 5 seconds
  const lastSearch = events.filter((e) => e.type === 'search').slice(-1)[0];
  if (lastSearch && lastSearch.targetName === cleanQuery && now - lastSearch.timestamp < 5000) {
    return;
  }

  let localSuccess = false;
  const eventId = `evt-search-${now}-${Math.random().toString(36).slice(2, 6)}`;

  try {
    const newEvent: AnalyticsEvent = {
      id: eventId,
      restaurantId: restaurantName,
      type: 'search',
      targetName: cleanQuery,
      timestamp: now,
    };
    saveEvents(restaurantName, [...events, newEvent]);
    localSuccess = true;
  } catch {
    localSuccess = false;
  }

  // Dispatch asynchronous Supabase cloud insert
  dispatchCloudInsert(
    restaurantName,
    'search',
    null,
    cleanQuery,
    cloudRestaurantId,
    { queryLength: cleanQuery.length }
  ).then((res) => {
    notifyDiagnostics({
      id: eventId,
      eventType: 'search',
      targetName: cleanQuery,
      targetId: null,
      localSuccess,
      cloudStatus: res.status,
      cloudError: res.error,
      restaurantId: res.restaurantId,
      timestamp: now,
    });
  });
};

/**
 * Track last category click timestamp to avoid rapid duplicate triggers
 */
let lastCategoryId: string | null = null;
let lastCategoryTime = 0;

/**
 * Record when a customer selects a category tab
 */
export const recordCategorySelect = (
  restaurantName: string,
  category: { id: string; name: string },
  cloudRestaurantId?: string | null
) => {
  if (!category || !category.name) return;

  const now = Date.now();
  // Prevent duplicate logs of the same category click within 3 seconds
  if (lastCategoryId === category.id && now - lastCategoryTime < 3000) {
    return;
  }
  lastCategoryId = category.id;
  lastCategoryTime = now;

  let localSuccess = false;
  const eventId = `evt-cat-${now}-${Math.random().toString(36).slice(2, 6)}`;

  try {
    const events = getStoredEvents(restaurantName);
    const newEvent: AnalyticsEvent = {
      id: eventId,
      restaurantId: restaurantName,
      type: 'category_select',
      targetId: category.id,
      targetName: category.name,
      timestamp: now,
    };
    saveEvents(restaurantName, [...events, newEvent]);
    localSuccess = true;
  } catch {
    localSuccess = false;
  }

  // Dispatch asynchronous Supabase cloud insert
  dispatchCloudInsert(
    restaurantName,
    'category_select',
    category.id,
    category.name,
    cloudRestaurantId,
    { categoryId: category.id }
  ).then((res) => {
    notifyDiagnostics({
      id: eventId,
      eventType: 'category_select',
      targetName: category.name,
      targetId: category.id,
      localSuccess,
      cloudStatus: res.status,
      cloudError: res.error,
      restaurantId: res.restaurantId,
      timestamp: now,
    });
  });
};

/**
 * Send an explicit test event to verify cloud connectivity directly from UI
 */
export const trackTestCloudAnalyticsEvent = async (
  restaurantName: string,
  cloudRestaurantId?: string | null
): Promise<AnalyticsTrackingResult> => {
  const now = Date.now();
  const testId = `test-${now}`;
  const targetName = `Test Engagement Ping (${new Date(now).toLocaleTimeString()})`;

  const res = await dispatchCloudInsert(
    restaurantName,
    'menu_visit',
    null,
    targetName,
    cloudRestaurantId,
    { testPing: true }
  );

  const diag: AnalyticsTrackingResult = {
    id: testId,
    eventType: 'menu_visit',
    targetName,
    targetId: null,
    localSuccess: true,
    cloudStatus: res.status,
    cloudError: res.error,
    restaurantId: res.restaurantId,
    timestamp: now,
  };

  notifyDiagnostics(diag);
  return diag;
};

/**
 * Compute honest engagement metrics from recorded interactions
 */
export const getEngagementSummary = (restaurantName: string): EngagementSummary => {
  try {
    const events = getStoredEvents(restaurantName);

    if (events.length === 0) {
      return {
        totalVisits: 0,
        totalDishViews: 0,
        totalSearches: 0,
        totalCategoryClicks: 0,
        mostViewedDishes: [],
        popularSearches: [],
        mostViewedCategories: [],
        recentEvents: [],
        lastUpdated: null,
        hasRecordedData: false,
      };
    }

    let totalVisits = 0;
    let totalDishViews = 0;
    let totalSearches = 0;
    let totalCategoryClicks = 0;

    const dishCounts: { [key: string]: { id: string; name: string; category?: string; count: number } } = {};
    const searchCounts: { [term: string]: number } = {};
    const categoryCounts: { [key: string]: { id: string; name: string; count: number } } = {};

    for (const evt of events) {
      if (evt.type === 'menu_visit') {
        totalVisits++;
      } else if (evt.type === 'dish_view' && evt.targetName) {
        totalDishViews++;
        const key = evt.targetId || evt.targetName;
        if (!dishCounts[key]) {
          dishCounts[key] = {
            id: evt.targetId || key,
            name: evt.targetName,
            category: evt.category,
            count: 0,
          };
        }
        dishCounts[key].count++;
      } else if (evt.type === 'search' && evt.targetName) {
        totalSearches++;
        const term = evt.targetName.trim();
        searchCounts[term] = (searchCounts[term] || 0) + 1;
      } else if (evt.type === 'category_select' && evt.targetName) {
        totalCategoryClicks++;
        const key = evt.targetId || evt.targetName;
        if (!categoryCounts[key]) {
          categoryCounts[key] = {
            id: evt.targetId || key,
            name: evt.targetName,
            count: 0,
          };
        }
        categoryCounts[key].count++;
      }
    }

    const mostViewedDishes: DishEngagement[] = Object.values(dishCounts)
      .map((d) => ({
        id: d.id,
        name: d.name,
        category: d.category,
        views: d.count,
      }))
      .sort((a, b) => b.views - a.views);

    const popularSearches: SearchEngagement[] = Object.entries(searchCounts)
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count);

    const mostViewedCategories: CategoryEngagement[] = Object.values(categoryCounts)
      .map((c) => ({
        id: c.id,
        name: c.name,
        views: c.count,
      }))
      .sort((a, b) => b.views - a.views);

    const recentEvents = [...events].reverse().slice(0, 15);
    const lastUpdated = events[events.length - 1]?.timestamp || null;

    return {
      totalVisits,
      totalDishViews,
      totalSearches,
      totalCategoryClicks,
      mostViewedDishes,
      popularSearches,
      mostViewedCategories,
      recentEvents,
      lastUpdated,
      hasRecordedData: events.length > 0,
    };
  } catch (err) {
    console.error('Failed to compute analytics summary:', err);
    return {
      totalVisits: 0,
      totalDishViews: 0,
      totalSearches: 0,
      totalCategoryClicks: 0,
      mostViewedDishes: [],
      popularSearches: [],
      mostViewedCategories: [],
      recentEvents: [],
      lastUpdated: null,
      hasRecordedData: false,
    };
  }
};

/**
 * Clear analytics for testing or reset
 */
export const clearAnalytics = (restaurantName: string) => {
  try {
    const key = getStorageKey(restaurantName);
    localStorage.removeItem(key);
    const sessionKey = `sm_session_visit_${restaurantName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    sessionStorage.removeItem(sessionKey);
  } catch {
    // ignore
  }
};

/**
 * Optional seed helper for test/demo mode (clearly marked as demo)
 */
export const seedDemoEngagementEvents = (restaurantName: string) => {
  const now = Date.now();
  const demoEvents: AnalyticsEvent[] = [
    { id: 'demo-1', restaurantId: restaurantName, type: 'menu_visit', timestamp: now - 3600000 * 24 },
    { id: 'demo-2', restaurantId: restaurantName, type: 'menu_visit', timestamp: now - 3600000 * 18 },
    { id: 'demo-3', restaurantId: restaurantName, type: 'menu_visit', timestamp: now - 3600000 * 12 },
    { id: 'demo-4', restaurantId: restaurantName, type: 'menu_visit', timestamp: now - 3600000 * 6 },
    { id: 'demo-5', restaurantId: restaurantName, type: 'menu_visit', timestamp: now - 3600000 * 2 },
    { id: 'demo-6', restaurantId: restaurantName, type: 'dish_view', targetId: 'dish-1', targetName: 'Avocado Sev Puri Flight', category: 'chaats', timestamp: now - 3600000 * 23 },
    { id: 'demo-7', restaurantId: restaurantName, type: 'dish_view', targetId: 'dish-1', targetName: 'Avocado Sev Puri Flight', category: 'chaats', timestamp: now - 3600000 * 17 },
    { id: 'demo-8', restaurantId: restaurantName, type: 'dish_view', targetId: 'dish-1', targetName: 'Avocado Sev Puri Flight', category: 'chaats', timestamp: now - 3600000 * 5 },
    { id: 'demo-9', restaurantId: restaurantName, type: 'dish_view', targetId: 'dish-3', targetName: 'Smoked Portobello Galouti Sliders', category: 'tandoor', timestamp: now - 3600000 * 15 },
    { id: 'demo-10', restaurantId: restaurantName, type: 'dish_view', targetId: 'dish-3', targetName: 'Smoked Portobello Galouti Sliders', category: 'tandoor', timestamp: now - 3600000 * 4 },
    { id: 'demo-11', restaurantId: restaurantName, type: 'dish_view', targetId: 'dish-6', targetName: 'Kokum Lemongrass Botanical Fizz', category: 'beverages', timestamp: now - 3600000 * 10 },
    { id: 'demo-12', restaurantId: restaurantName, type: 'search', targetName: 'chaat', timestamp: now - 3600000 * 20 },
    { id: 'demo-13', restaurantId: restaurantName, type: 'search', targetName: 'chaat', timestamp: now - 3600000 * 14 },
    { id: 'demo-14', restaurantId: restaurantName, type: 'search', targetName: 'tandoor', timestamp: now - 3600000 * 9 },
    { id: 'demo-15', restaurantId: restaurantName, type: 'search', targetName: 'vegan', timestamp: now - 3600000 * 3 },
    { id: 'demo-16', restaurantId: restaurantName, type: 'category_select', targetId: 'chaats', targetName: 'Artisanal Chaats', timestamp: now - 3600000 * 22 },
    { id: 'demo-17', restaurantId: restaurantName, type: 'category_select', targetId: 'chaats', targetName: 'Artisanal Chaats', timestamp: now - 3600000 * 13 },
    { id: 'demo-18', restaurantId: restaurantName, type: 'category_select', targetId: 'tandoor', targetName: 'Tandoor & Small Plates', timestamp: now - 3600000 * 8 },
    { id: 'demo-19', restaurantId: restaurantName, type: 'category_select', targetId: 'beverages', targetName: 'Handcrafted Coolers & Chai', timestamp: now - 3600000 * 2 },
  ];

  saveEvents(restaurantName, demoEvents);
};
