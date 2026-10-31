import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Sparkles, 
  Star, 
  MapPin, 
  Clock, 
  Wifi, 
  Flame, 
  Leaf, 
  Utensils, 
  UtensilsCrossed,
  X, 
  ChevronRight, 
  ArrowLeft, 
  Smartphone, 
  Monitor, 
  Phone,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Share2,
  Info,
  RefreshCw
} from 'lucide-react';
import { Dish, Category, RestaurantInfo, ActiveView } from '../../types';
import { INITIAL_DISHES } from '../../data/initialData';
import { 
  recordMenuVisit, 
  recordDishView, 
  recordSearch, 
  recordCategorySelect
} from '../../data/analyticsStore';
import { fetchPublishedMenuFromCloud } from '../../supabase/syncService';
import { isSupabaseConfigured } from '../../supabase/client';
import { useSupabaseAuth } from '../../supabase/useSupabaseAuth';

interface CustomerMenuViewProps {
  restaurant: RestaurantInfo;
  categories: Category[];
  dishes: Dish[];
  setActiveView: (view: ActiveView) => void;
  setDishes?: React.Dispatch<React.SetStateAction<Dish[]>>;
  cloudRestaurantId?: string | null;
}

export const CustomerMenuView: React.FC<CustomerMenuViewProps> = ({
  restaurant,
  categories,
  dishes,
  setActiveView,
  setDishes,
  cloudRestaurantId,
}) => {
  const { user } = useSupabaseAuth();

  // Active state populated from props and kept in sync with Supabase cloud
  const [activeRestaurant, setActiveRestaurant] = useState<RestaurantInfo>(restaurant);
  const [activeCategories, setActiveCategories] = useState<Category[]>(categories);
  const [activeDishes, setActiveDishes] = useState<Dish[]>(dishes);
  const [activeRestaurantId, setActiveRestaurantId] = useState<string | null>(cloudRestaurantId || null);

  const [isLoadingFromCloud, setIsLoadingFromCloud] = useState<boolean>(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState<number>(0);

  // Sync state if props update from owner
  useEffect(() => {
    setActiveRestaurant(restaurant);
  }, [restaurant]);

  useEffect(() => {
    setActiveCategories(categories);
  }, [categories]);

  useEffect(() => {
    setActiveDishes(dishes);
  }, [dishes]);

  useEffect(() => {
    if (cloudRestaurantId) {
      setActiveRestaurantId(cloudRestaurantId);
    }
  }, [cloudRestaurantId]);

  // Navigation & Search state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'vegetarian' | 'non-vegetarian' | 'vegan'>('all');
  const [onlyGlutenFree, setOnlyGlutenFree] = useState<boolean>(false);

  // Helper to extract restaurant slug/identifier from URL parameters
  const getIdentifierFromUrl = (): string | null => {
    try {
      const hash = window.location.hash;
      const qIdx = hash.indexOf('?');
      if (qIdx !== -1) {
        const p = new URLSearchParams(hash.slice(qIdx));
        const r = p.get('restaurant') || p.get('slug') || p.get('id');
        if (r) return r;
      }
      const s = new URLSearchParams(window.location.search);
      const r = s.get('restaurant') || s.get('slug') || s.get('id');
      if (r) return r;
    } catch {
      // fallback
    }
    return null;
  };

  // Fetch live published menu directly from Supabase
  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured) {
      return;
    }

    const urlIdentifier = getIdentifierFromUrl();
    const queryIdent = urlIdentifier || activeRestaurant.slug || activeRestaurant.name;

    setIsLoadingFromCloud(true);
    setCloudError(null);

    fetchPublishedMenuFromCloud(queryIdent)
      .then((res) => {
        if (!isMounted) return;
        setIsLoadingFromCloud(false);
        if (res.restaurant) {
          setActiveRestaurant(res.restaurant);
          setCloudError(null);
          if (res.categories && res.categories.length > 0) {
            setActiveCategories(res.categories);
          }
          if (res.dishes) {
            setActiveDishes(res.dishes);
            if (setDishes) {
              setDishes(res.dishes);
            }
          }
          if (res.restaurantId) {
            setActiveRestaurantId(res.restaurantId);
            try {
              localStorage.setItem('smartmenu_cloud_restaurant_id', res.restaurantId);
            } catch {
              // ignore
            }
          }
        } else if (res.error) {
          setCloudError(res.error);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setIsLoadingFromCloud(false);
        setCloudError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      isMounted = false;
    };
  }, [refreshCount]);

  // Read table number from URL (e.g. #/menu?table=6)
  const [currentTable] = useState<number | null>(() => {
    try {
      const hash = window.location.hash;
      const queryIdx = hash.indexOf('?');
      if (queryIdx !== -1) {
        const params = new URLSearchParams(hash.slice(queryIdx));
        const t = params.get('table');
        if (t && !isNaN(Number(t))) return Number(t);
      }
      const search = new URLSearchParams(window.location.search);
      const t = search.get('table');
      if (t && !isNaN(Number(t))) return Number(t);
    } catch {
      // fallback
    }
    return 4; // Default table
  });

  // Desktop simulator toggle (Phone Frame vs Wide Screen)
  const [isMobileFrameView, setIsMobileFrameView] = useState<boolean>(true);

  // Selected dish detail modal
  const [selectedDishDetail, setSelectedDishDetail] = useState<Dish | null>(null);

  // Image load error fallback state (record dish IDs where image failed to load)
  const [failedImages, setFailedImages] = useState<{ [dishId: string]: boolean }>({});

  // "What should I eat?" AI Sommelier Recommendation Wizard Modal
  const [isRecommendationModalOpen, setIsRecommendationModalOpen] = useState<boolean>(false);
  const [recCraving, setRecCraving] = useState<'chaat' | 'comfort' | 'light' | 'tandoor' | 'beverage'>('chaat');
  const [recHunger, setRecHunger] = useState<'light' | 'hungry'>('hungry');
  const [recDiet, setRecDiet] = useState<'any' | 'vegan' | 'mild'>('any');
  const [recommendationResult, setRecommendationResult] = useState<Dish[] | null>(null);

  // Share feedback toast
  const [shareToast, setShareToast] = useState<string | null>(null);

  const handleShareMenu = () => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
        setShareToast('Menu link copied to clipboard!');
        setTimeout(() => setShareToast(null), 2500);
      }
    } catch {
      setShareToast('Menu URL: ' + window.location.href);
      setTimeout(() => setShareToast(null), 2500);
    }
  };

  // Track public menu visit on mount (guarded against re-renders & throttled per session)
  const hasLoggedVisit = useRef(false);
  useEffect(() => {
    if (!hasLoggedVisit.current && activeRestaurant.name) {
      hasLoggedVisit.current = true;
      recordMenuVisit(activeRestaurant.name, activeRestaurantId, { table: currentTable });
    }
  }, [activeRestaurant.name, activeRestaurantId, currentTable]);

  // Debounced search query tracking (records searches with at least 2 characters)
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) return;
    const timer = setTimeout(() => {
      recordSearch(activeRestaurant.name, q, activeRestaurantId);
    }, 900);
    return () => clearTimeout(timer);
  }, [searchQuery, activeRestaurant.name, activeRestaurantId]);

  // Track dish view when a customer deliberately opens/expands a dish modal
  const handleOpenDishDetail = (dish: Dish) => {
    setSelectedDishDetail(dish);
    const categoryName = activeCategories.find((c) => c.id === dish.category)?.name || dish.category;
    recordDishView(
      activeRestaurant.name,
      {
        id: dish.id,
        name: dish.name,
        category: categoryName,
        price: dish.price,
      },
      activeRestaurantId
    );
  };

  // Track category interaction when a customer clicks a category tab
  const handleSelectCategory = (categoryId: string, catName?: string) => {
    setSelectedCategory(categoryId);
    if (categoryId !== 'all') {
      const catObj = activeCategories.find((c) => c.id === categoryId);
      recordCategorySelect(
        activeRestaurant.name,
        {
          id: categoryId,
          name: catName || catObj?.name || categoryId,
        },
        activeRestaurantId
      );
    }
  };

  // Filtered dishes based on activeDishes and activeCategories
  const filteredDishes = activeDishes.filter((dish) => {
    // Category filter
    const matchesCategory = selectedCategory === 'all' || dish.category === selectedCategory;

    // Search query (matches name, description, tags, category name)
    const q = searchQuery.toLowerCase().trim();
    const categoryName = activeCategories.find((c) => c.id === dish.category)?.name?.toLowerCase() || '';
    const matchesSearch =
      !q ||
      dish.name.toLowerCase().includes(q) ||
      dish.description.toLowerCase().includes(q) ||
      categoryName.includes(q) ||
      dish.tags.some((t) => t.toLowerCase().includes(q));

    // Dietary filter
    let matchesDietary = true;
    if (dietaryFilter === 'vegetarian') {
      matchesDietary = dish.dietaryType !== 'non-vegetarian';
    } else if (dietaryFilter === 'non-vegetarian') {
      matchesDietary = dish.dietaryType === 'non-vegetarian';
    } else if (dietaryFilter === 'vegan') {
      matchesDietary = dish.dietaryType === 'vegan' || dish.isVegan;
    }

    // Gluten-free toggle
    const matchesGlutenFree = !onlyGlutenFree || dish.isGlutenFree;

    return matchesCategory && matchesSearch && matchesDietary && matchesGlutenFree;
  });

  const isFilteringActive =
    selectedCategory !== 'all' ||
    searchQuery.trim() !== '' ||
    dietaryFilter !== 'all' ||
    onlyGlutenFree;

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setDietaryFilter('all');
    setOnlyGlutenFree(false);
  };

  // Reset to default sample dishes if menu was completely emptied
  const handleRestoreSampleDishes = () => {
    if (setDishes) {
      setDishes(INITIAL_DISHES);
      setActiveDishes(INITIAL_DISHES);
    } else {
      setActiveDishes(INITIAL_DISHES);
      localStorage.setItem('smartmenu_dishes', JSON.stringify(INITIAL_DISHES));
      window.location.reload();
    }
  };

  // Calculate AI recommendation (strictly excludes unavailable dishes)
  const handleGenerateRecommendation = () => {
    // Strictly filter out any dish that is unavailable
    let pool = activeDishes.filter((d) => d.isAvailable);

    if (recDiet === 'vegan') {
      pool = pool.filter((d) => d.isVegan || d.dietaryType === 'vegan');
    } else if (recDiet === 'mild') {
      pool = pool.filter((d) => d.spiceLevel <= 1);
    }

    let primary: Dish | undefined;
    let secondary: Dish | undefined;

    if (recCraving === 'chaat') {
      primary = pool.find((d) => d.category === 'chaats');
      secondary = pool.find((d) => d.category === 'beverages') || pool.find((d) => d.category !== 'chaats');
    } else if (recCraving === 'comfort') {
      primary = pool.find((d) => d.category === 'mains');
      secondary = pool.find((d) => d.category === 'breads-rice') || pool.find((d) => d.category === 'beverages');
    } else if (recCraving === 'light') {
      primary = pool.find((d) => d.category === 'chaats' || d.tags.includes('Healthy Choice') || d.isVegan);
      secondary = pool.find((d) => d.category === 'beverages');
    } else if (recCraving === 'tandoor') {
      primary = pool.find((d) => d.category === 'tandoor');
      secondary = pool.find((d) => d.category === 'breads-rice') || pool.find((d) => d.category === 'beverages');
    } else {
      primary = pool.find((d) => d.category === 'beverages');
      secondary = pool.find((d) => d.category === 'desserts') || pool.find((d) => d.category === 'chaats');
    }

    const recs: Dish[] = [];
    if (primary) recs.push(primary);
    if (secondary && secondary.id !== primary?.id) recs.push(secondary);

    // Fallback if specific craving slots didn't match
    if (recs.length === 0 && pool.length > 0) {
      recs.push(pool[0]);
      if (pool[1]) recs.push(pool[1]);
    }

    setRecommendationResult(recs);
  };

  // Helper for rendering food image or attractive culinary placeholder
  const renderDishVisual = (dish: Dish, sizeClasses: string = 'w-18 h-18 sm:w-22 sm:h-22') => {
    const hasImage = dish.image && !failedImages[dish.id];

    if (hasImage) {
      return (
        <div className={`relative ${sizeClasses} rounded-xl overflow-hidden shrink-0 border border-slate-700/80 shadow-sm bg-slate-900`}>
          <img
            src={dish.image}
            alt={dish.name}
            onError={() => setFailedImages((prev) => ({ ...prev, [dish.id]: true }))}
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover transition-transform duration-300 ${
              !dish.isAvailable ? 'grayscale-[40%] contrast-90' : 'hover:scale-105'
            }`}
          />
          {/* Prominent Currently Unavailable Overlay */}
          {!dish.isAvailable && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-[2px] flex items-center justify-center p-1 text-center">
              <span className="text-[10px] sm:text-[11px] font-extrabold text-rose-300 uppercase tracking-tight leading-tight">
                Currently<br />unavailable
              </span>
            </div>
          )}
        </div>
      );
    }

    // Attractive Category-Specific Culinary Placeholder
    const getPlaceholderIcon = () => {
      switch (dish.category) {
        case 'chaats':
          return <Sparkles className="w-6 h-6 text-amber-400" />;
        case 'tandoor':
          return <Flame className="w-6 h-6 text-rose-400" />;
        case 'mains':
          return <Utensils className="w-6 h-6 text-teal-400" />;
        case 'beverages':
        case 'desserts':
          return <Sparkles className="w-6 h-6 text-cyan-400" />;
        default:
          return <UtensilsCrossed className="w-6 h-6 text-teal-400" />;
      }
    };

    return (
      <div
        className={`relative ${sizeClasses} rounded-xl overflow-hidden shrink-0 border border-slate-800 bg-gradient-to-br from-slate-900 via-[#0d1c33] to-[#0a1526] flex flex-col items-center justify-center shadow-inner`}
      >
        <div className="p-2 rounded-full bg-slate-800/80 mb-1">
          {getPlaceholderIcon()}
        </div>
        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider text-center px-1 truncate max-w-full">
          {activeCategories.find((c) => c.id === dish.category)?.name?.split(' ')[0] || 'Dish'}
        </span>

        {/* Prominent Currently Unavailable Overlay for Placeholder */}
        {!dish.isAvailable && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-[2px] flex items-center justify-center p-1 text-center">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-rose-300 uppercase tracking-tight leading-tight">
              Currently<br />unavailable
            </span>
          </div>
        )}
      </div>
    );
  };

  // Check if visitor is the verified authenticated owner of this restaurant
  const isVerifiedOwner = Boolean(
    user && (user.id === activeRestaurant.ownerId || user.id === restaurant.ownerId)
  );

  return (
    <div className="w-full max-w-full min-h-screen bg-[#060b14] text-slate-100 flex flex-col items-center overflow-x-hidden selection:bg-teal-500/30 selection:text-teal-200">
      {/* Toast Notification */}
      {shareToast && (
        <div className="fixed top-16 z-50 bg-teal-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs sm:text-sm animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{shareToast}</span>
        </div>
      )}

      {/* Top Application Bar with Navigation */}
      <header className="w-full max-w-full bg-[#080e1a]/95 border-b border-slate-800/80 px-3 sm:px-4 py-2.5 sm:py-3 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-4 min-w-0">
          {/* Header Left: Return to Dashboard ONLY for verified restaurant owners; otherwise clean customer branding */}
          <div className="flex items-center gap-2 min-w-0">
            {isVerifiedOwner ? (
              <button
                onClick={() => setActiveView('dashboard')}
                className="px-2.5 py-1.5 sm:px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700/80 flex items-center gap-1.5 transition-colors shrink-0"
                title="Return to Restaurant Management Dashboard"
              >
                <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden xs:inline">Back to </span>
                <span>Dashboard</span>
              </button>
            ) : (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-sm shadow-teal-500/20">
                  <UtensilsCrossed className="w-4 h-4 stroke-[2.3]" />
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-xs sm:text-sm text-white truncate leading-tight">
                    {activeRestaurant.name}
                  </div>
                  <div className="text-[10px] text-teal-400 truncate">
                    {activeRestaurant.cuisine}
                  </div>
                </div>
              </div>
            )}

            {isVerifiedOwner && (
              <span className="hidden sm:inline-block text-xs text-slate-400 truncate">
                Owner Preview · <span className="font-mono text-teal-300">#/menu</span>
              </span>
            )}
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Refresh Live Menu from Supabase Cloud */}
            <button
              onClick={() => setRefreshCount((c) => c + 1)}
              disabled={isLoadingFromCloud}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center gap-1.5 text-xs transition-colors disabled:opacity-50"
              title="Refresh menu from cloud"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${isLoadingFromCloud ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isLoadingFromCloud ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              onClick={handleShareMenu}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center gap-1.5 text-xs transition-colors"
              title="Copy public menu link"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Desktop Simulator View Toggle */}
            <div className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <button
                onClick={() => setIsMobileFrameView(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
                  isMobileFrameView
                    ? 'bg-teal-400 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Preview in simulated mobile device frame"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Phone View</span>
              </button>
              <button
                onClick={() => setIsMobileFrameView(false)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
                  !isMobileFrameView
                    ? 'bg-teal-400 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Preview in full width layout"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Full Width</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div
        className={`w-full max-w-full transition-all duration-300 py-2 sm:py-6 px-2 sm:px-4 flex justify-center ${
          isMobileFrameView ? 'max-w-md' : 'max-w-4xl'
        }`}
      >
        <div
          className={`w-full max-w-full bg-[#0a1222] border border-slate-800/90 shadow-2xl relative flex flex-col ${
            isMobileFrameView ? 'rounded-2xl sm:rounded-[36px] overflow-hidden' : 'rounded-2xl sm:rounded-3xl'
          }`}
        >

          {/* 1. RESTAURANT HERO BANNER & BRAND IDENTITY */}
          <div className="relative p-4 sm:p-6 bg-gradient-to-b from-[#112344] via-[#0d1a33] to-[#0a1222] border-b border-slate-800/80 w-full min-w-0">
            {/* Top Badges: Table & Open Hours */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full bg-teal-950/80 border border-teal-500/40 text-teal-300 text-[11px] sm:text-xs font-bold font-mono">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span>Contactless Digital Menu</span>
              </div>

              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px] sm:text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Open Now</span>
              </div>
            </div>

            {/* Cloud Sync and Status Banners */}
            {cloudError && (
              <div className="mb-3 p-2.5 rounded-xl bg-amber-950/70 border border-amber-600/50 text-amber-200 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">Menu cloud update: {cloudError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRefreshCount((c) => c + 1)}
                  className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold rounded text-[10px] shrink-0"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Restaurant Title & Brand Emblem */}
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0">
                {activeRestaurant.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight break-words">
                  {activeRestaurant.name}
                </h1>
                <p className="text-xs sm:text-sm font-medium text-teal-300 mt-0.5 truncate">
                  {activeRestaurant.cuisine}
                </p>
              </div>
            </div>

            {/* Short Restaurant Description */}
            <p className="text-xs sm:text-sm text-slate-300 mt-2.5 leading-relaxed break-words">
              {activeRestaurant.tagline}
            </p>

            {/* Metadata Information: Rating, Address, Hours, Phone */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
              <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs text-slate-300">
                <span className="flex items-center gap-1 text-amber-300 font-bold font-mono">
                  <Star className="w-3.5 h-3.5 fill-current shrink-0" />
                  {activeRestaurant.rating}
                </span>
                <span className="text-slate-400 font-mono">({activeRestaurant.reviewsCount} sample reviews)</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <Leaf className="w-3.5 h-3.5 shrink-0" />
                  <span>Pure Vegetarian Kitchen</span>
                </span>
              </div>

              <div className="flex items-start gap-2 text-[11px] sm:text-xs text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                <span className="break-words">{activeRestaurant.address}, {activeRestaurant.city}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[11px] sm:text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{activeRestaurant.openingHours}</span>
                </div>
                <span aria-hidden="true" className="text-slate-600 hidden sm:inline">·</span>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span className="font-mono">+91 80 4965 2200</span>
                </div>
              </div>

              {/* Wi-Fi Details */}
              {activeRestaurant.wifiSsid && (
                <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] text-teal-400/90 font-mono pt-1">
                  <Wifi className="w-3.5 h-3.5 shrink-0 text-teal-400" />
                  <span>Guest Wi-Fi: {activeRestaurant.wifiSsid}</span>
                  {activeRestaurant.wifiPass ? (
                    <>
                      <span className="text-slate-600">·</span>
                      <span>Pass: {activeRestaurant.wifiPass}</span>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* 2. "WHAT SHOULD I EAT?" RECOMMENDATION BUTTON BANNER */}
          <div className="p-3 sm:p-4 bg-gradient-to-r from-teal-950/40 via-[#0e2740] to-teal-950/40 border-b border-teal-500/30 w-full min-w-0">
            <div className="flex items-center justify-between gap-2.5 sm:gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-teal-500/20 shrink-0">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                    What should I eat today?
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-300 truncate">
                    Find chef pairings tailored to your craving
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setRecommendationResult(null);
                  setIsRecommendationModalOpen(true);
                }}
                className="px-3 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 active:scale-95 rounded-xl transition-all shadow-md shadow-teal-500/20 whitespace-nowrap shrink-0"
              >
                Recommend Dish
              </button>
            </div>
          </div>

          {/* 3. SEARCH AND FILTERS */}
          <div className="p-3 sm:p-4 border-b border-slate-800 space-y-2.5 sm:space-y-3 w-full min-w-0 bg-[#091122]">
            {/* Search Field */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dish by name, description, or ingredients..."
                className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dietary Filter Buttons (Vegetarian, Non-Vegetarian, Vegan, Gluten-Free) */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none min-w-0 max-w-full">
              <button
                onClick={() => setDietaryFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                  dietaryFilter === 'all'
                    ? 'bg-teal-400 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-300 border border-slate-700/80 hover:text-white'
                }`}
              >
                All Dietary
              </button>

              <button
                onClick={() => setDietaryFilter(dietaryFilter === 'vegetarian' ? 'all' : 'vegetarian')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
                  dietaryFilter === 'vegetarian'
                    ? 'bg-emerald-950 text-emerald-200 border border-emerald-500 font-bold'
                    : 'bg-slate-900 text-slate-300 border border-slate-700/80 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span>Vegetarian</span>
              </button>

              <button
                onClick={() => setDietaryFilter(dietaryFilter === 'non-vegetarian' ? 'all' : 'non-vegetarian')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
                  dietaryFilter === 'non-vegetarian'
                    ? 'bg-rose-950 text-rose-200 border border-rose-500 font-bold'
                    : 'bg-slate-900 text-slate-300 border border-slate-700/80 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                <span>Non-Vegetarian</span>
              </button>

              <button
                onClick={() => setDietaryFilter(dietaryFilter === 'vegan' ? 'all' : 'vegan')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
                  dietaryFilter === 'vegan'
                    ? 'bg-teal-950 text-teal-200 border border-teal-400 font-bold'
                    : 'bg-slate-900 text-slate-300 border border-slate-700/80 hover:text-white'
                }`}
              >
                <Leaf className="w-3 h-3 text-teal-400 shrink-0" />
                <span>Vegan</span>
              </button>

              <button
                onClick={() => setOnlyGlutenFree(!onlyGlutenFree)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
                  onlyGlutenFree
                    ? 'bg-cyan-950 text-cyan-200 border border-cyan-400 font-bold'
                    : 'bg-slate-900 text-slate-300 border border-slate-700/80 hover:text-white'
                }`}
              >
                <span>Gluten-Free</span>
              </button>
            </div>

            {/* Active Filters Summary Strip */}
            {isFilteringActive && (
              <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-slate-400 border-t border-slate-800/60">
                <span>
                  Showing <strong className="text-white font-mono">{filteredDishes.length}</strong> of{' '}
                  <span className="font-mono">{activeDishes.length}</span> dishes
                </span>
                <button
                  onClick={clearAllFilters}
                  className="text-teal-400 hover:text-teal-300 font-semibold underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* 4. CATEGORY NAVIGATION TABS */}
          <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-slate-800 overflow-x-auto flex items-center gap-1.5 scrollbar-none bg-[#08101f] sticky top-[48px] sm:top-[57px] z-30 min-w-0 max-w-full">
            <button
              onClick={() => handleSelectCategory('all')}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-teal-400 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white bg-slate-900/70 border border-slate-800'
              }`}
            >
              All ({activeDishes.length})
            </button>
            {activeCategories.map((cat) => {
              const count = activeDishes.filter((d) => d.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id, cat.name)}
                  className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                    selectedCategory === cat.id
                      ? 'bg-teal-400 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white bg-slate-900/70 border border-slate-800'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>

          {/* 5. DISH CARDS LIST */}
          <div className="p-3 sm:p-4 space-y-3 flex-1 overflow-y-auto w-full">
            {filteredDishes.map((dish) => {
              const isAvailable = dish.isAvailable;
              const isNonVeg = dish.dietaryType === 'non-vegetarian';
              const isVegan = dish.dietaryType === 'vegan' || dish.isVegan;

              return (
                <div
                  key={dish.id}
                  onClick={() => handleOpenDishDetail(dish)}
                  tabIndex={0}
                  role="button"
                  aria-disabled={!isAvailable}
                  className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer relative min-w-0 select-none ${
                    isAvailable
                      ? 'bg-[#0e1930] border-slate-800 hover:border-teal-500/40 hover:bg-[#101d38] active:scale-[0.99]'
                      : 'bg-[#09101c]/80 border-slate-800/60 opacity-65 grayscale-[35%]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    {/* Left: Dish Details */}
                    <div className="flex-1 min-w-0">
                      {/* Dietary Indicator + Dish Title */}
                      <div className="flex items-center gap-1.5 min-w-0">
                        {/* Standard Indian Food Safety Emblem */}
                        {isNonVeg ? (
                          <span
                            className="w-3.5 h-3.5 border border-rose-500 flex items-center justify-center p-0.5 shrink-0 rounded-xs"
                            title="Non-Vegetarian"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          </span>
                        ) : isVegan ? (
                          <span
                            className="w-3.5 h-3.5 border border-teal-400 flex items-center justify-center p-0.5 shrink-0 rounded-xs"
                            title="100% Vegan"
                          >
                            <Leaf className="w-2.5 h-2.5 text-teal-400" />
                          </span>
                        ) : (
                          <span
                            className="w-3.5 h-3.5 border border-emerald-500 flex items-center justify-center p-0.5 shrink-0 rounded-xs"
                            title="Pure Vegetarian"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          </span>
                        )}

                        <h3 className="font-bold text-xs sm:text-sm md:text-base text-white truncate">
                          {dish.name}
                        </h3>
                      </div>

                      {/* Price in INR */}
                      <div className="text-xs sm:text-sm md:text-base font-extrabold text-teal-300 font-mono mt-0.5 sm:mt-1">
                        ₹{dish.price}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mt-1">
                        {dish.description}
                      </p>

                      {/* Metadata Row: Prep Time, Dietary Label, Spice, Availability Badge */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-slate-400 mt-2">
                        <span>{dish.prepTime || '12 mins'}</span>
                        <span aria-hidden="true">·</span>

                        {isVegan ? (
                          <>
                            <span className="text-teal-300 font-medium">Vegan</span>
                            <span aria-hidden="true">·</span>
                          </>
                        ) : isNonVeg ? (
                          <>
                            <span className="text-rose-400 font-medium">Non-Veg</span>
                            <span aria-hidden="true">·</span>
                          </>
                        ) : (
                          <>
                            <span className="text-emerald-400 font-medium">Pure Veg</span>
                            <span aria-hidden="true">·</span>
                          </>
                        )}

                        <span>
                          {dish.spiceLevel === 0 ? 'Mild' : dish.spiceLevel === 1 ? 'Medium' : dish.spiceLevel === 2 ? 'Spicy' : 'Fiery'}
                        </span>

                        {dish.isGlutenFree && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-cyan-300">Gluten-Free</span>
                          </>
                        )}

                        {/* Explicit Currently unavailable label required by Feature 4 */}
                        {!isAvailable && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950/90 text-rose-300 border border-rose-800">
                              <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                              <span>Currently unavailable</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: Food Image or Attractive Category Placeholder */}
                    {renderDishVisual(dish, 'w-18 h-18 sm:w-22 sm:h-22')}
                  </div>
                </div>
              );
            })}

            {/* Empty State when filters yield no matches */}
            {filteredDishes.length === 0 && activeDishes.length > 0 && (
              <div className="text-center py-12 px-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <Search className="w-8 h-8 text-slate-500 mx-auto" />
                <h4 className="text-sm sm:text-base font-bold text-white">No dishes matched your filter</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {searchQuery
                    ? `No items found matching "${searchQuery}".`
                    : 'No dishes available under the selected dietary or category criteria.'}
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-teal-500/20"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* Empty State when restaurant menu has 0 items */}
            {activeDishes.length === 0 && (
              <div className="text-center py-16 px-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <UtensilsCrossed className="w-12 h-12 text-teal-400/60 mx-auto" />
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-white">Menu Being Updated</h4>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                    {activeRestaurant.name} is currently curating a seasonal fresh digital menu. Please check back shortly or speak with our service staff.
                  </p>
                </div>
                {isVerifiedOwner && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                    <button
                      onClick={handleRestoreSampleDishes}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Load Sample Menu (14 dishes)</span>
                    </button>
                    <button
                      onClick={() => setActiveView('dashboard')}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                    >
                      Manage in Dashboard
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 6. PUBLIC MENU FOOTER */}
          <div className="p-3 sm:p-4 bg-[#080f1d] border-t border-slate-800/80 text-center space-y-1.5 text-[11px] sm:text-xs text-slate-400">
            <div className="flex items-center justify-center gap-1 text-slate-300">
              <span className="font-semibold text-white">{activeRestaurant.name}</span>
              <span>· Contactless Digital Menu</span>
            </div>
            <p className="text-slate-500">
              Prices in INR (₹). Subject to 5% GST. No service charge added.
            </p>
            {isVerifiedOwner && (
              <div className="pt-2">
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="text-xs text-teal-400 hover:underline font-semibold"
                >
                  ← Return to Restaurant Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DISH DETAIL POPUP MODAL */}
      {selectedDishDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b1426] border border-slate-700 rounded-2xl sm:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedDishDetail(null)}
              className="absolute top-3.5 right-3.5 z-10 w-8 h-8 rounded-full bg-slate-950/80 text-white flex items-center justify-center hover:bg-slate-900 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Food Image or Large Placeholder Banner */}
            {selectedDishDetail.image && !failedImages[selectedDishDetail.id] ? (
              <div className="relative w-full h-48 sm:h-56">
                <img
                  src={selectedDishDetail.image}
                  alt={selectedDishDetail.name}
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover ${
                    !selectedDishDetail.isAvailable ? 'grayscale-[40%] contrast-90' : ''
                  }`}
                />
                {!selectedDishDetail.isAvailable && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-bold text-rose-300 uppercase tracking-widest bg-rose-950/90 px-3 py-1.5 rounded-lg border border-rose-800">
                      Currently unavailable
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-36 sm:h-44 bg-gradient-to-br from-slate-900 via-[#0f2342] to-[#09152b] flex flex-col items-center justify-center p-4 relative border-b border-slate-800">
                <UtensilsCrossed className="w-10 h-10 text-teal-400 mb-2" />
                <span className="text-xs font-semibold text-slate-300">
                  {activeCategories.find((c) => c.id === selectedDishDetail.category)?.name || 'Chef Specialty'}
                </span>
                {!selectedDishDetail.isAvailable && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-bold text-rose-300 uppercase tracking-widest bg-rose-950/90 px-3 py-1.5 rounded-lg border border-rose-800">
                      Currently unavailable
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold mb-1">
                    {selectedDishDetail.dietaryType === 'non-vegetarian' ? (
                      <span className="text-rose-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                        Non-Vegetarian
                      </span>
                    ) : selectedDishDetail.dietaryType === 'vegan' || selectedDishDetail.isVegan ? (
                      <span className="text-teal-300 flex items-center gap-1">
                        <Leaf className="w-3 h-3 text-teal-400" />
                        100% Vegan
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        Pure Vegetarian
                      </span>
                    )}
                    {selectedDishDetail.isGlutenFree && <span className="text-cyan-300">· Gluten-Free</span>}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white break-words">{selectedDishDetail.name}</h3>
                </div>
                <div className="text-lg sm:text-xl font-mono font-extrabold text-teal-300 shrink-0">
                  ₹{selectedDishDetail.price}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {selectedDishDetail.description}
              </p>

              {/* Status Notice if unavailable */}
              {!selectedDishDetail.isAvailable ? (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-xs text-rose-200 flex items-start gap-2 leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-white">Currently unavailable</strong>
                    <p className="text-[11px] text-rose-300 mt-0.5">
                      This item is temporarily out of stock in the kitchen today. Our servers will be happy to recommend similar dishes.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Dish Specifics */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-1.5">
                <div className="flex justify-between">
                  <span>Category:</span>
                  <span className="text-white font-medium">
                    {categories.find((c) => c.id === selectedDishDetail.category)?.name || selectedDishDetail.category}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Preparation Time:</span>
                  <span className="text-white font-mono">{selectedDishDetail.prepTime || '12 mins'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Spice Profile:</span>
                  <span className="text-white">
                    {selectedDishDetail.spiceLevel === 0
                      ? 'Mild & Aromatic'
                      : selectedDishDetail.spiceLevel === 1
                      ? 'Medium Spices'
                      : selectedDishDetail.spiceLevel === 2
                      ? 'Spicy Punch'
                      : 'Fiery Hot'}
                  </span>
                </div>
                {selectedDishDetail.calories && (
                  <div className="flex justify-between">
                    <span>Approximate Energy:</span>
                    <span className="text-white font-mono">{selectedDishDetail.calories} kcal</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Availability:</span>
                  <span className={selectedDishDetail.isAvailable ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-bold'}>
                    {selectedDishDetail.isAvailable ? 'Available for Table Service' : 'Currently unavailable'}
                  </span>
                </div>
              </div>

              <div className="pt-1 sm:pt-2">
                <button
                  onClick={() => setSelectedDishDetail(null)}
                  className="w-full py-2.5 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl transition-colors text-center"
                >
                  Close Dish Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* "WHAT SHOULD I EAT?" AI SOMMELIER WIZARD MODAL */}
      {isRecommendationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b1426] border border-teal-500/40 rounded-2xl sm:rounded-3xl w-full max-w-lg p-4 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsRecommendationModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
              aria-label="Close wizard"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 text-teal-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>SmartMenu AI Sommelier</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white">What should I eat today?</h2>
            <p className="text-xs text-slate-300 mt-1 mb-4 sm:mb-5">
              Tell us your craving and appetite, and we&apos;ll curate the perfect selection from currently available dishes.
            </p>

            {!recommendationResult ? (
              <div className="space-y-4 sm:space-y-5">
                {/* Step 1: Mood / Craving */}
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-2">
                    1. What flavor vibe are you craving?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      { id: 'chaat', label: 'Crisp & Tangy Chaat', icon: '🌶️' },
                      { id: 'comfort', label: 'Rich & Creamy Curries', icon: '🍲' },
                      { id: 'tandoor', label: 'Charred Smoky Tandoor', icon: '🔥' },
                      { id: 'light', label: 'Light & Botanical Bites', icon: '🥗' },
                      { id: 'beverage', label: 'Chilled Artisanal Drinks', icon: '🥭' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setRecCraving(item.id as any)}
                        className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all ${
                          recCraving === item.id
                            ? 'bg-teal-950/60 border-teal-400 text-teal-300 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className="mr-1.5">{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: Hunger Level */}
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-2">
                    2. How hungry are you?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setRecHunger('light')}
                      className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all ${
                        recHunger === 'light'
                          ? 'bg-teal-950/60 border-teal-400 text-teal-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      Light Nibble / Quick Bite
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecHunger('hungry')}
                      className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all ${
                        recHunger === 'hungry'
                          ? 'bg-teal-950/60 border-teal-400 text-teal-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      Hungry / Full Meal Feast
                    </button>
                  </div>
                </div>

                {/* Step 3: Dietary Preference */}
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-2">
                    3. Dietary preference:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setRecDiet('any')}
                      className={`p-2 sm:p-2.5 rounded-xl border text-center transition-all ${
                        recDiet === 'any'
                          ? 'bg-teal-950/60 border-teal-400 text-teal-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      All Pure Veg
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecDiet('vegan')}
                      className={`p-2 sm:p-2.5 rounded-xl border text-center transition-all ${
                        recDiet === 'vegan'
                          ? 'bg-teal-950/60 border-teal-400 text-teal-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      100% Vegan
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecDiet('mild')}
                      className={`p-2 sm:p-2.5 rounded-xl border text-center transition-all ${
                        recDiet === 'mild'
                          ? 'bg-teal-950/60 border-teal-400 text-teal-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      Mild / No Chili
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleGenerateRecommendation}
                    className="w-full py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 active:scale-[0.98] rounded-xl transition-all shadow-md shadow-teal-500/20 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>Get Chef Recommendations</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Recommendation Results View */
              <div className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-200">
                <div className="p-3 sm:p-4 rounded-xl bg-teal-950/40 border border-teal-500/40 text-xs text-teal-200 leading-relaxed">
                  <strong>Chef&apos;s Recommendation:</strong> Selected from our{' '}
                  <span className="font-semibold underline">currently available</span> menu items for your craving:
                </div>

                {recommendationResult.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
                    <Info className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-300">
                      All items in this specific craving vibe are currently unavailable in the kitchen today.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Please try another craving vibe or browse our live menu dishes.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 sm:space-y-3">
                    {recommendationResult.map((dish) => (
                      <div
                        key={dish.id}
                        onClick={() => {
                          setIsRecommendationModalOpen(false);
                          handleOpenDishDetail(dish);
                        }}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-400/50 flex items-center justify-between gap-3 cursor-pointer transition-colors min-w-0"
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                          {renderDishVisual(dish, 'w-12 h-12 sm:w-14 sm:h-14')}
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-xs sm:text-sm text-white truncate">{dish.name}</div>
                            <div className="text-[11px] sm:text-xs text-slate-400 truncate">{dish.description}</div>
                            <div className="text-xs font-mono font-bold text-teal-300 mt-0.5 sm:mt-1">
                              ₹{dish.price}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                  <button
                    onClick={() => setRecommendationResult(null)}
                    className="w-full sm:w-auto flex-1 py-2 sm:py-2.5 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors text-center"
                  >
                    Change Preferences
                  </button>
                  <button
                    onClick={() => setIsRecommendationModalOpen(false)}
                    className="w-full sm:w-auto flex-1 py-2 sm:py-2.5 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl transition-colors text-center"
                  >
                    Browse Full Menu
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
