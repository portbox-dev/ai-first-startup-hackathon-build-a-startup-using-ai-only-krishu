import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  Search, 
  Layers, 
  Smartphone, 
  Info, 
  RefreshCw, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { RestaurantInfo, ActiveView, DashboardTab } from '../../types';
import { 
  getEngagementSummary, 
  clearAnalytics, 
  seedDemoEngagementEvents,
  EngagementSummary 
} from '../../data/analyticsStore';
import { supabase, isSupabaseConfigured } from '../../supabase/client';
import { useSupabaseAuth } from '../../supabase/useSupabaseAuth';

interface AnalyticsTabProps {
  restaurant: RestaurantInfo;
  setActiveView?: (view: ActiveView) => void;
  setActiveTab?: (tab: DashboardTab) => void;
  cloudRestaurantId?: string | null;
}

export interface CloudAnalyticsRecord {
  id: string;
  event_type: string;
  target_name: string;
  target_id: string | null;
  session_id: string;
  created_at: string;
}

export const formatKolkataTimestamp = (timestamp: string | number | Date): string => {
  try {
    const d = typeof timestamp === 'string' || typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
    if (isNaN(d.getTime())) return String(timestamp);
    return (
      new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(d) + ' IST'
    );
  } catch {
    return new Date(timestamp).toLocaleTimeString();
  }
};

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ 
  restaurant, 
  setActiveView, 
  setActiveTab,
  cloudRestaurantId 
}) => {
  const { user } = useSupabaseAuth();
  const [summary, setSummary] = useState<EngagementSummary>(() =>
    getEngagementSummary(restaurant.name)
  );
  const [cloudEventsCount, setCloudEventsCount] = useState<number | null>(null);
  const [cloudEvents, setCloudEvents] = useState<CloudAnalyticsRecord[]>([]);
  const [cloudNotice, setCloudNotice] = useState<string | null>(null);
  const [isCheckingCloud, setIsCheckingCloud] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchCloudEvents = async () => {
    if (!supabase || !isSupabaseConfigured) {
      setCloudEventsCount(null);
      setCloudEvents([]);
      setCloudNotice('Supabase is not configured.');
      return;
    }
    if (!user) {
      setCloudEventsCount(null);
      setCloudEvents([]);
      setCloudNotice('Signed out. Sign in as the restaurant owner to query cloud-synced analytics.');
      return;
    }
    setIsCheckingCloud(true);
    setCloudNotice(null);
    try {
      let targetId = cloudRestaurantId;
      if (!targetId) {
        targetId = localStorage.getItem('smartmenu_cloud_restaurant_id') || null;
      }
      if (!targetId) {
        const { data: rest } = await supabase
          .from('restaurants')
          .select('id')
          .eq('owner_id', user.id)
          .limit(1)
          .maybeSingle();
        targetId = rest?.id || null;
      }

      if (targetId) {
        const { count, data, error } = await supabase
          .from('menu_analytics_events')
          .select('id, event_type, target_name, target_id, session_id, created_at', { count: 'exact' })
          .eq('restaurant_id', targetId)
          .order('created_at', { ascending: false })
          .limit(40);

        if (error) {
          setCloudNotice(`Cloud query notice: ${error.message}`);
          setCloudEventsCount(null);
          setCloudEvents([]);
        } else {
          if (typeof count === 'number') setCloudEventsCount(count);
          if (data) {
            // Strictly sort newest first by created_at event timestamp
            const sorted = [...(data as CloudAnalyticsRecord[])].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setCloudEvents(sorted);
          }
          setCloudNotice(null);
        }
      } else {
        setCloudNotice('No active restaurant profile found in Supabase for this account.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCloudNotice(`Cloud query error: ${msg}`);
      setCloudEventsCount(null);
      setCloudEvents([]);
    } finally {
      setIsCheckingCloud(false);
    }
  };

  const refreshData = () => {
    const updated = getEngagementSummary(restaurant.name);
    setSummary(updated);
    fetchCloudEvents();
  };

  // Automatically sync analytics in background every 15 seconds
  useEffect(() => {
    refreshData();
    const interval = setInterval(() => {
      refreshData();
    }, 15000);
    return () => clearInterval(interval);
  }, [restaurant.name, cloudRestaurantId, user]);

  interface UnifiedActivityEvent {
    id: string;
    type: 'menu_visit' | 'dish_view' | 'search' | 'category_select';
    targetName?: string;
    timestampMs: number;
    formattedTime: string;
  }

  const unifiedActivityEvents = React.useMemo<UnifiedActivityEvent[]>(() => {
    const list: UnifiedActivityEvent[] = [];
    const seenKeys = new Set<string>();

    // 1. Add canonical cloud events
    for (const evt of cloudEvents) {
      const ms = new Date(evt.created_at).getTime();
      const type = evt.event_type as 'menu_visit' | 'dish_view' | 'search' | 'category_select';
      const key = `${type}_${evt.target_name || ''}_${Math.floor(ms / 3000)}`;
      seenKeys.add(key);
      list.push({
        id: `cloud-${evt.id}`,
        type,
        targetName: evt.target_name || undefined,
        timestampMs: ms,
        formattedTime: formatKolkataTimestamp(evt.created_at),
      });
    }

    // 2. Add local events if not already represented in cloud events within ~3 seconds
    for (const evt of summary.recentEvents) {
      const ms = typeof evt.timestamp === 'number' ? evt.timestamp : new Date(evt.timestamp).getTime();
      const key = `${evt.type}_${evt.targetName || ''}_${Math.floor(ms / 3000)}`;
      if (!seenKeys.has(key)) {
        list.push({
          id: `local-${evt.id}`,
          type: evt.type,
          targetName: evt.targetName,
          timestampMs: ms,
          formattedTime: formatKolkataTimestamp(evt.timestamp),
        });
      }
    }

    return list.sort((a, b) => b.timestampMs - a.timestampMs);
  }, [cloudEvents, summary.recentEvents]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleClearAnalytics = () => {
    if (window.confirm('Reset all recorded menu engagement analytics for this restaurant?')) {
      clearAnalytics(restaurant.name);
      setIsDemoMode(false);
      refreshData();
      showToast('Engagement analytics cleared.');
    }
  };

  const handleLoadDemoData = () => {
    seedDemoEngagementEvents(restaurant.name);
    setIsDemoMode(true);
    refreshData();
    showToast('Loaded demo engagement data for testing.');
  };

  const hasData = summary.totalVisits > 0 || 
    summary.totalDishViews > 0 || 
    summary.totalSearches > 0 || 
    summary.totalCategoryClicks > 0;

  const maxDishViews = summary.mostViewedDishes.length > 0
    ? Math.max(...summary.mostViewedDishes.map((d) => d.views), 1)
    : 1;

  const maxCategoryViews = summary.mostViewedCategories.length > 0
    ? Math.max(...summary.mostViewedCategories.map((c) => c.views), 1)
    : 1;

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-teal-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs sm:text-sm animate-in slide-in-from-top-4 duration-200 max-w-[calc(100vw-2rem)]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="break-words leading-tight">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 w-full min-w-0">
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-950/80 border border-teal-800/60 text-teal-300 text-xs font-semibold mb-1.5 sm:mb-2 max-w-full">
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Honest Engagement Analytics</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight break-words">
            Menu Engagement Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 break-words">
            Real customer browsing activity, dish explorations, and popular searches for {restaurant.name}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={refreshData}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
            title="Refresh analytics data"
          >
            <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {hasData && (
            <button
              type="button"
              onClick={handleClearAnalytics}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800/60 text-xs text-slate-400 hover:text-rose-300 transition-colors flex items-center gap-1.5"
              title="Reset local analytics data"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          {setActiveTab && (
            <button
              type="button"
              onClick={() => setActiveTab('insights')}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-teal-300 hover:text-white transition-colors flex items-center gap-1.5"
              title="Open AI Menu Insights"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>AI Insights</span>
            </button>
          )}

          {setActiveView && (
            <button
              type="button"
              onClick={() => setActiveView('customer-menu')}
              className="px-3 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-teal-500/20 flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Test Customer Menu</span>
            </button>
          )}
        </div>
      </div>

      {/* Demo Data Notice (Only if demo data is loaded) */}
      {isDemoMode && (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 w-full min-w-0">
          <div className="flex items-start sm:items-center gap-2 min-w-0 flex-1">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <span className="break-words leading-relaxed">
              <strong>Demo Data Active:</strong> These figures are simulated for dashboard preview. They do not represent real customer interactions.
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearAnalytics}
            className="text-xs font-bold text-amber-300 hover:underline shrink-0 self-end sm:self-auto"
          >
            Clear Demo Data
          </button>
        </div>
      )}


      {/* 4 Core Engagement Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Total Menu Visits */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0f1b33] border border-slate-800 min-w-0">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">1. Total Menu Visits</span>
            <Eye className="w-4 h-4 text-teal-400 shrink-0" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
              {summary.totalVisits}
            </span>
            <span className="text-xs text-slate-400 font-mono">sessions</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Customers opening the public menu route or QR scan
          </p>
        </div>

        {/* Metric 2: Total Dish Detail Views */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0f1b33] border border-slate-800 min-w-0">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">2. Dish Detail Views</span>
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
              {summary.totalDishViews}
            </span>
            <span className="text-xs text-slate-400 font-mono">dish clicks</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Counted when a guest opens a dish to inspect details
          </p>
        </div>

        {/* Metric 3: Popular Searches */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0f1b33] border border-slate-800 min-w-0">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">3. Customer Searches</span>
            <Search className="w-4 h-4 text-amber-400 shrink-0" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
              {summary.totalSearches}
            </span>
            <span className="text-xs text-slate-400 font-mono">queries</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Ingredient and dish keyword searches submitted
          </p>
        </div>

        {/* Metric 4: Category Explorations */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0f1b33] border border-slate-800 min-w-0">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">4. Category Clicks</span>
            <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
              {summary.totalCategoryClicks}
            </span>
            <span className="text-xs text-slate-400 font-mono">selections</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Navigation tab clicks exploring different courses
          </p>
        </div>
      </div>

      {/* Main Body: Empty State OR Analytics Grids */}
      {!hasData ? (
        <div className="p-8 sm:p-12 rounded-2xl bg-[#0f1b33] border border-slate-800 text-center space-y-4 max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-white">
              No Menu Interactions Recorded Yet
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Analytics will appear when customers start exploring your menu. As guests scan your QR code, click dishes, select categories, or search for items, live engagement metrics will populate here.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {setActiveView && (
              <button
                type="button"
                onClick={() => setActiveView('customer-menu')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-teal-500/20 flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Public Menu to Generate Activity</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLoadDemoData}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Explore Sample Demo Insights
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
          {/* Grid: Most-Viewed Dishes & Popular Searches */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 w-full">
            {/* Left: Most-Viewed Dishes */}
            <div className="lg:col-span-7 p-4 sm:p-6 rounded-2xl bg-[#0f1b33] border border-slate-800 space-y-4 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Most-Viewed Dishes</h3>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Dishes guests clicked to read full descriptions & ingredients
                  </p>
                </div>
                <span className="text-[11px] text-teal-400 font-mono">
                  {summary.mostViewedDishes.length} items tracked
                </span>
              </div>

              {summary.mostViewedDishes.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                  No dish views recorded yet. Click on any dish card in the customer menu to record a view.
                </div>
              ) : (
                <div className="space-y-3">
                  {summary.mostViewedDishes.slice(0, 6).map((dish, idx) => {
                    const widthPercent = Math.max(10, Math.round((dish.views / maxDishViews) * 100));
                    return (
                      <div key={dish.id || dish.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs min-w-0">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="w-5 h-5 rounded-md bg-slate-800 text-teal-300 font-mono text-[10px] flex items-center justify-center font-bold shrink-0">
                              #{idx + 1}
                            </span>
                            <span className="font-bold text-slate-200 truncate">{dish.name}</span>
                            {dish.category && (
                              <span className="text-[10px] text-slate-500 uppercase font-semibold hidden sm:inline">
                                · {dish.category}
                              </span>
                            )}
                          </div>
                          <span className="font-mono font-bold text-teal-300 text-xs shrink-0 pl-2">
                            {dish.views} view{dish.views > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full transition-all duration-500"
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Popular Searches */}
            <div className="lg:col-span-5 p-4 sm:p-6 rounded-2xl bg-[#0f1b33] border border-slate-800 space-y-4 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Popular Searches</h3>
                  <p className="text-[11px] sm:text-xs text-slate-400">Keywords typed into the menu search</p>
                </div>
                <Search className="w-4 h-4 text-amber-400 shrink-0" />
              </div>

              {summary.popularSearches.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                  No searches recorded yet. Queries entered in the menu search bar will appear here.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {summary.popularSearches.slice(0, 6).map((item, idx) => (
                    <div
                      key={item.term}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-slate-800 text-amber-400 font-mono text-[10px] flex items-center justify-center font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-mono text-slate-200 truncate capitalize">
                          &ldquo;{item.term}&rdquo;
                        </span>
                      </div>
                      <span className="font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded text-[11px] shrink-0">
                        {item.count} search{item.count > 1 ? 'es' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Grid: Most-Viewed Categories & Real-Time Event Log */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 w-full">
            {/* Left: Most-Viewed Categories */}
            <div className="lg:col-span-6 p-4 sm:p-6 rounded-2xl bg-[#0f1b33] border border-slate-800 space-y-4 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Most-Viewed Categories</h3>
                  <p className="text-[11px] sm:text-xs text-slate-400">Sections guests selected in the menu</p>
                </div>
                <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>

              {summary.mostViewedCategories.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                  No category clicks recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {summary.mostViewedCategories.slice(0, 6).map((cat, idx) => {
                    const widthPercent = Math.max(10, Math.round((cat.views / maxCategoryViews) * 100));
                    return (
                      <div key={cat.id || cat.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs min-w-0">
                          <span className="font-semibold text-slate-200 truncate">
                            {idx + 1}. {cat.name}
                          </span>
                          <span className="font-mono font-bold text-emerald-300 text-xs shrink-0 pl-2">
                            {cat.views} interaction{cat.views > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Unified Recent Menu Activity */}
            <div className="lg:col-span-6 p-4 sm:p-6 rounded-2xl bg-[#0f1b33] border border-slate-800 space-y-4 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Recent Menu Activity</h3>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Timestamps in India Standard Time (Asia/Kolkata)
                  </p>
                </div>
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              </div>

              {unifiedActivityEvents.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
                  No menu interactions recorded yet. Customer browsing activity will appear here in real time.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                  {unifiedActivityEvents.slice(0, 15).map((evt) => (
                    <div
                      key={evt.id}
                      className="p-2 sm:p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between gap-2 text-xs min-w-0"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            evt.type === 'menu_visit'
                              ? 'bg-teal-400'
                              : evt.type === 'dish_view'
                              ? 'bg-cyan-400'
                              : evt.type === 'search'
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                        />
                        <span className="text-slate-200 font-medium truncate">
                          {evt.type === 'menu_visit' && 'Opened digital menu'}
                          {evt.type === 'dish_view' && `Viewed: ${evt.targetName || 'Dish'}`}
                          {evt.type === 'search' && `Searched: "${evt.targetName || ''}"`}
                          {evt.type === 'category_select' && `Category: ${evt.targetName || 'All'}`}
                        </span>
                      </div>
                      <span className="shrink-0 text-[10px] text-slate-400 font-mono">
                        {evt.formattedTime}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
