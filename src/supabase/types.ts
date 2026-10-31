/**
 * Supabase Multi-Restaurant SaaS Database Types
 * Mirrors the PostgreSQL schema for SmartMenu multi-tenant architecture.
 */

export interface DatabaseRestaurant {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  tagline: string;
  cuisine: string;
  city: string;
  address: string;
  opening_hours: string;
  contact_number: string;
  wifi_ssid: string;
  wifi_pass: string;
  rating: number;
  reviews_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseRestaurantMember {
  id: string;
  restaurant_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'staff';
  created_at: string;
}

export interface DatabaseCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  icon_name?: string;
  sort_order: number;
  created_at: string;
}

export interface DatabaseDish {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  price: number;
  description: string;
  image: string | null;
  is_available: boolean;
  dietary_type: 'vegetarian' | 'vegan' | 'non-vegetarian';
  is_vegan: boolean;
  is_gluten_free: boolean;
  spice_level: number;
  prep_time: string;
  calories: number | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface DatabaseAnalyticsEvent {
  id: string;
  restaurant_id: string;
  event_type: 'menu_visit' | 'dish_view' | 'search' | 'category_select';
  target_id: string | null;
  target_name: string;
  session_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type SupabaseStatus = 'unconfigured' | 'connecting' | 'connected' | 'error';

export interface SupabaseConfigInfo {
  status: SupabaseStatus;
  url: string | null;
  isConfigured: boolean;
  message: string;
}
