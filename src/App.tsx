/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { DashboardLayout } from './components/Dashboard/DashboardLayout';
import { CustomerMenuView } from './components/CustomerMenu/CustomerMenuView';
import { INITIAL_RESTAURANT, INITIAL_CATEGORIES, INITIAL_DISHES } from './data/initialData';
import { ActiveView, DashboardTab, Dish, Category, RestaurantInfo } from './types';
import { useSupabaseAuth } from './supabase/useSupabaseAuth';
import { loadOwnerRestaurantWithMenu } from './supabase/syncService';
import { isSupabaseConfigured } from './supabase/client';

export default function App() {
  // Initialize view from URL hash, search params, or path (supports #/menu, /menu, ?restaurant=slug)
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    try {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      const search = new URLSearchParams(window.location.search);
      const hashQuery = hash.includes('?') ? new URLSearchParams(hash.slice(hash.indexOf('?'))) : null;

      if (
        hash.includes('menu') ||
        path.includes('/menu') ||
        search.has('restaurant') ||
        search.has('slug') ||
        hashQuery?.has('restaurant') ||
        hashQuery?.has('slug')
      ) {
        return 'customer-menu';
      }
      if (hash.includes('dashboard') || path.endsWith('/dashboard')) {
        return 'dashboard';
      }
    } catch {
      // fallback
    }
    return 'landing';
  });

  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('overview');

  // Keep URL hash synchronized with activeView without stripping query parameters
  useEffect(() => {
    try {
      if (activeView === 'customer-menu') {
        if (!window.location.hash.toLowerCase().includes('menu')) {
          const targetSlug = restaurant.slug || 'green-leaf-caf';
          window.location.hash = `/menu?restaurant=${encodeURIComponent(targetSlug)}`;
        }
      } else if (activeView === 'dashboard') {
        if (!window.location.hash.toLowerCase().includes('dashboard')) {
          window.location.hash = '/dashboard';
        }
      } else {
        const hash = window.location.hash.toLowerCase();
        const search = window.location.search.toLowerCase();
        // Never clear hash if it contains menu or restaurant query parameter
        if (hash.includes('menu') || hash.includes('restaurant=') || search.includes('restaurant=')) {
          setActiveView('customer-menu');
        } else if (hash.includes('dashboard') || hash === '#' || hash === '#/') {
          window.location.hash = '';
        }
      }
    } catch {
      // ignore in environments without history access
    }
  }, [activeView]);

  // Listen to browser hash and popstate changes (e.g. back/forward navigation or manual URL edits)
  useEffect(() => {
    const handleHashChange = () => {
      try {
        const hash = window.location.hash.toLowerCase();
        const search = new URLSearchParams(window.location.search);
        const hashQuery = hash.includes('?') ? new URLSearchParams(hash.slice(hash.indexOf('?'))) : null;

        if (
          hash.includes('menu') ||
          search.has('restaurant') ||
          search.has('slug') ||
          hashQuery?.has('restaurant') ||
          hashQuery?.has('slug')
        ) {
          setActiveView('customer-menu');
        } else if (hash.includes('dashboard')) {
          setActiveView('dashboard');
        } else if (!hash || hash === '#' || hash === '#/') {
          setActiveView('landing');
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  // Restaurant State with localStorage persistence
  const [restaurant, setRestaurant] = useState<RestaurantInfo>(() => {
    try {
      const saved = localStorage.getItem('smartmenu_restaurant');
      return saved ? JSON.parse(saved) : INITIAL_RESTAURANT;
    } catch {
      return INITIAL_RESTAURANT;
    }
  });

  // Dishes State with localStorage persistence
  const [dishes, setDishes] = useState<Dish[]>(() => {
    try {
      const saved = localStorage.getItem('smartmenu_dishes');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((d: any) => ({
            ...d,
            dietaryType: (d.dietaryType === 'vegan' || d.dietaryType === 'non-vegetarian') ? d.dietaryType : 'vegetarian',
            isAvailable: d.isAvailable !== false,
            price: typeof d.price === 'number' && !isNaN(d.price) ? d.price : 0,
            spiceLevel: typeof d.spiceLevel === 'number' ? d.spiceLevel : 1,
            prepTime: d.prepTime || '12 mins',
            tags: Array.isArray(d.tags) ? d.tags : [],
          }));
        }
      }
      return INITIAL_DISHES;
    } catch {
      return INITIAL_DISHES;
    }
  });

  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);

  useEffect(() => {
    try {
      localStorage.setItem('smartmenu_restaurant', JSON.stringify(restaurant));
    } catch {
      // ignore
    }
  }, [restaurant]);

  useEffect(() => {
    try {
      localStorage.setItem('smartmenu_dishes', JSON.stringify(dishes));
    } catch {
      // ignore
    }
  }, [dishes]);

  // Hydrate cloud restaurant data if user is authenticated with Supabase
  const { user } = useSupabaseAuth();
  const [cloudRestaurantId, setCloudRestaurantId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('smartmenu_cloud_restaurant_id');
    } catch {
      return null;
    }
  });
  const [isCloudLoading, setIsCloudLoading] = useState(false);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      return;
    }

    let isMounted = true;
    setIsCloudLoading(true);

    loadOwnerRestaurantWithMenu(user.id)
      .then((res) => {
        if (!isMounted) return;
        setIsCloudLoading(false);
        if (res.success && res.restaurantId) {
          setCloudRestaurantId(res.restaurantId);
          try {
            localStorage.setItem('smartmenu_cloud_restaurant_id', res.restaurantId);
          } catch {
            // ignore
          }
        }
        if (res.success && res.restaurant) {
          setRestaurant(res.restaurant);
          if (res.dishes && res.dishes.length > 0) {
            setDishes(res.dishes);
          }
        }
      })
      .catch(() => {
        if (isMounted) setIsCloudLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Scroll to top on view switch
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeView]);

  return (
    <div className="min-h-screen bg-[#080e1a] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar is visible on landing page */}
      {activeView === 'landing' && (
        <Navbar activeView={activeView} setActiveView={setActiveView} />
      )}

      {/* Screen 1: Landing Page */}
      {activeView === 'landing' && (
        <LandingPage setActiveView={setActiveView} />
      )}

      {/* Screen 2 & 3: Restaurant Dashboard & Menu Management */}
      {activeView === 'dashboard' && (
        <DashboardLayout
          restaurant={restaurant}
          setRestaurant={setRestaurant}
          categories={categories}
          dishes={dishes}
          setDishes={setDishes}
          activeTab={dashboardTab}
          setActiveTab={setDashboardTab}
          setActiveView={setActiveView}
          cloudRestaurantId={cloudRestaurantId}
        />
      )}

      {/* Screen 4: Customer Digital Menu */}
      {activeView === 'customer-menu' && (
        <CustomerMenuView
          restaurant={restaurant}
          categories={categories}
          dishes={dishes}
          setDishes={setDishes}
          setActiveView={setActiveView}
          cloudRestaurantId={cloudRestaurantId}
        />
      )}
    </div>
  );
}
