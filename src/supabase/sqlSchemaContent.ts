/**
 * PostgreSQL Schema for Supabase Setup
 * Exported as string so users can 1-click copy directly from the dashboard settings UI.
 */
export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- SmartMenu Multi-Restaurant SaaS Database Schema & Row-Level Security (RLS)
-- Run this in your Supabase Project -> SQL Editor
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: restaurants
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    tagline TEXT DEFAULT '',
    cuisine TEXT DEFAULT 'Modern Bistro',
    city TEXT DEFAULT '',
    address TEXT DEFAULT '',
    opening_hours TEXT DEFAULT '11:00 AM - 11:00 PM',
    contact_number TEXT DEFAULT '',
    wifi_ssid TEXT DEFAULT '',
    wifi_pass TEXT DEFAULT '',
    rating NUMERIC(3, 2) DEFAULT 4.90 CHECK (rating >= 1.0 AND rating <= 5.0),
    reviews_count INTEGER DEFAULT 0 CHECK (reviews_count >= 0),
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Table: restaurant_members
CREATE TABLE IF NOT EXISTS public.restaurant_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (restaurant_id, user_id)
);

-- Table: categories
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT NOT NULL,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    icon_name TEXT DEFAULT 'Utensils',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (restaurant_id, id)
);

-- Table: dishes
CREATE TABLE IF NOT EXISTS public.dishes (
    id TEXT NOT NULL,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    description TEXT DEFAULT '',
    image TEXT,
    is_available BOOLEAN DEFAULT true,
    dietary_type TEXT DEFAULT 'vegetarian' CHECK (dietary_type IN ('vegetarian', 'vegan', 'non-vegetarian')),
    is_vegan BOOLEAN DEFAULT false,
    is_gluten_free BOOLEAN DEFAULT false,
    spice_level SMALLINT DEFAULT 1 CHECK (spice_level BETWEEN 0 AND 3),
    prep_time TEXT DEFAULT '12 mins',
    calories INTEGER,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (restaurant_id, id)
);

-- Table: menu_analytics_events
CREATE TABLE IF NOT EXISTS public.menu_analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('menu_visit', 'dish_view', 'search', 'category_select')),
    target_id TEXT,
    target_name TEXT NOT NULL,
    session_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_owner ON public.restaurants(owner_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_members_user ON public.restaurant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_restaurant ON public.categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_dishes_restaurant ON public.dishes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_dishes_category ON public.dishes(restaurant_id, category_id);
CREATE INDEX IF NOT EXISTS idx_analytics_restaurant_time ON public.menu_analytics_events(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.menu_analytics_events(restaurant_id, event_type);

-- Updated_at Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_restaurants_updated_at ON public.restaurants;
CREATE TRIGGER trigger_restaurants_updated_at
BEFORE UPDATE ON public.restaurants
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_dishes_updated_at ON public.dishes;
CREATE TRIGGER trigger_dishes_updated_at
BEFORE UPDATE ON public.dishes
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_analytics_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_restaurant_member(p_restaurant_id UUID, p_required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.restaurant_members
        WHERE restaurant_id = p_restaurant_id
          AND user_id = auth.uid()
          AND (
            p_required_role = 'staff'
            OR (p_required_role = 'manager' AND role IN ('owner', 'manager'))
            OR (p_required_role = 'owner' AND role = 'owner')
          )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies: restaurants
CREATE POLICY "Public read published restaurants"
ON public.restaurants FOR SELECT
USING (is_published = true OR owner_id = auth.uid() OR public.is_restaurant_member(id, 'staff'));

CREATE POLICY "Authenticated users can create restaurants"
ON public.restaurants FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners and managers can update restaurant"
ON public.restaurants FOR UPDATE
TO authenticated
USING (owner_id = auth.uid() OR public.is_restaurant_member(id, 'manager'))
WITH CHECK (owner_id = auth.uid() OR public.is_restaurant_member(id, 'manager'));

CREATE POLICY "Owners can delete restaurant"
ON public.restaurants FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- Policies: restaurant_members
CREATE POLICY "Members can view their own memberships"
ON public.restaurant_members FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_restaurant_member(restaurant_id, 'manager'));

CREATE POLICY "Owners can manage restaurant members"
ON public.restaurant_members FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.restaurants
        WHERE restaurants.id = restaurant_members.restaurant_id
          AND restaurants.owner_id = auth.uid()
    )
);

-- Policies: categories
CREATE POLICY "Public can view categories of published restaurants"
ON public.categories FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.restaurants
        WHERE restaurants.id = categories.restaurant_id
          AND (restaurants.is_published = true OR restaurants.owner_id = auth.uid() OR public.is_restaurant_member(restaurants.id, 'staff'))
    )
);

CREATE POLICY "Owners and managers can modify categories"
ON public.categories FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.restaurants
        WHERE restaurants.id = categories.restaurant_id
          AND (restaurants.owner_id = auth.uid() OR public.is_restaurant_member(restaurants.id, 'manager'))
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.restaurants
        WHERE restaurants.id = categories.restaurant_id
          AND (restaurants.owner_id = auth.uid() OR public.is_restaurant_member(restaurants.id, 'manager'))
    )
);

-- Policies: dishes
CREATE POLICY "Public can view dishes of published restaurants"
ON public.dishes FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.restaurants
        WHERE restaurants.id = dishes.restaurant_id
          AND (restaurants.is_published = true OR restaurants.owner_id = auth.uid() OR public.is_restaurant_member(restaurants.id, 'staff'))
    )
);

CREATE POLICY "Owners and managers can modify dishes"
ON public.dishes FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.restaurants
        WHERE restaurants.id = dishes.restaurant_id
          AND (restaurants.owner_id = auth.uid() OR public.is_restaurant_member(restaurants.id, 'manager'))
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.restaurants
        WHERE restaurants.id = dishes.restaurant_id
          AND (restaurants.owner_id = auth.uid() OR public.is_restaurant_member(restaurants.id, 'manager'))
    )
);

-- Policies: menu_analytics_events
CREATE POLICY "Public can record engagement events"
ON public.menu_analytics_events FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.restaurants
        WHERE restaurants.id = menu_analytics_events.restaurant_id
          AND restaurants.is_published = true
    )
);

CREATE POLICY "Only owners and managers can view restaurant analytics"
ON public.menu_analytics_events FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.restaurants
        WHERE restaurants.id = menu_analytics_events.restaurant_id
          AND (restaurants.owner_id = auth.uid() OR public.is_restaurant_member(restaurants.id, 'manager'))
    )
);

CREATE POLICY "Owners can clear analytics events"
ON public.menu_analytics_events FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.restaurants
        WHERE restaurants.id = menu_analytics_events.restaurant_id
          AND restaurants.owner_id = auth.uid()
    )
);

-- Grant Permissions to allow RLS policies to control access
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.restaurants TO anon, authenticated;
GRANT ALL ON TABLE public.restaurant_members TO anon, authenticated;
GRANT ALL ON TABLE public.categories TO anon, authenticated;
GRANT ALL ON TABLE public.dishes TO anon, authenticated;
GRANT ALL ON TABLE public.menu_analytics_events TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Storage Bucket for Dish Photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('dish-images', 'dish-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public read dish images"
ON storage.objects FOR SELECT
USING (bucket_id = 'dish-images');

CREATE POLICY "Authenticated users can upload dish images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'dish-images' AND
    (
        split_part(name, '/', 1) = 'general' OR
        EXISTS (
            SELECT 1 FROM public.restaurants
            WHERE restaurants.id::text = split_part(name, '/', 1)
              AND (restaurants.owner_id = auth.uid() OR public.is_restaurant_member(restaurants.id, 'manager'))
        )
    )
);

CREATE POLICY "Owners can update dish images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'dish-images' AND
    EXISTS (
        SELECT 1 FROM public.restaurants
        WHERE restaurants.id::text = split_part(name, '/', 1)
          AND (restaurants.owner_id = auth.uid() OR public.is_restaurant_member(restaurants.id, 'manager'))
    )
);

CREATE POLICY "Owners can delete dish images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'dish-images' AND
    EXISTS (
        SELECT 1 FROM public.restaurants
        WHERE restaurants.id::text = split_part(name, '/', 1)
          AND (restaurants.owner_id = auth.uid() OR public.is_restaurant_member(restaurants.id, 'manager'))
    )
);
`;
