import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Utensils, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  ExternalLink, 
  QrCode, 
  Plus, 
  Clock, 
  BarChart3,
  Search,
  Layers
} from 'lucide-react';
import { Dish, RestaurantInfo, DashboardTab, ActiveView } from '../../types';
import { DEMO_AI_SUGGESTIONS } from '../../data/initialData';
import { getEngagementSummary, EngagementSummary } from '../../data/analyticsStore';

interface OverviewTabProps {
  restaurant: RestaurantInfo;
  dishes: Dish[];
  setDashboardTab: (tab: DashboardTab) => void;
  setActiveView: (view: ActiveView) => void;
  onOpenAddDish: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  restaurant,
  dishes,
  setDashboardTab,
  setActiveView,
  onOpenAddDish,
}) => {
  const [summary, setSummary] = useState<EngagementSummary>(() =>
    getEngagementSummary(restaurant.name)
  );

  useEffect(() => {
    setSummary(getEngagementSummary(restaurant.name));
  }, [restaurant.name]);

  const activeDishesCount = dishes.filter((d) => d.isAvailable).length;
  const unavailableDishesCount = dishes.filter((d) => !d.isAvailable).length;

  // Real most-viewed dish from recorded events
  const mostViewedDish = summary.mostViewedDishes.length > 0 ? summary.mostViewedDishes[0] : null;

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0d1a33] via-[#102345] to-[#0a1529] p-4 sm:p-6 md:p-8 border border-slate-700/80 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Welcome back</span>
            <span aria-hidden="true">·</span>
            <span>Live Digital Menu</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight break-words">
            {restaurant.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl break-words">
            {restaurant.tagline} · {restaurant.city}
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 shrink-0 w-full md:w-auto">
          <button
            onClick={() => setDashboardTab('menu')}
            className="w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Utensils className="w-4 h-4 text-teal-400 shrink-0" />
            <span>Manage Menu</span>
          </button>

          <button
            onClick={() => setActiveView('customer-menu')}
            className="w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl transition-all shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            <span>View Public Menu</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards with Real Recorded Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Menu Visits */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#0f1b33] border border-slate-800 min-w-0">
          <div className="flex items-center justify-between text-slate-400 mb-2 sm:mb-3">
            <span className="text-xs font-semibold">Total Menu Visits</span>
            <span className="text-[10px] font-mono text-teal-400/90 bg-teal-950/80 px-1.5 py-0.5 rounded border border-teal-800/60">
              Recorded
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
              {summary.totalVisits}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              sessions
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-2 truncate">
            {summary.totalVisits > 0
              ? `${summary.totalVisits} guest visits tracked locally`
              : 'Will increment when guests open menu'}
          </div>
        </div>

        {/* KPI 2: Total Active Dishes */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#0f1b33] border border-slate-800 min-w-0">
          <div className="flex items-center justify-between text-slate-400 mb-2 sm:mb-3">
            <span className="text-xs font-semibold">Active Menu Dishes</span>
            <Utensils className="w-4 h-4 text-teal-400 shrink-0" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
              {activeDishesCount}
            </span>
            <span className="text-xs font-medium text-slate-400">
              of {dishes.length} total
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-2 truncate">
            <span className="text-teal-400 font-medium">Live on digital menu</span>
          </div>
        </div>

        {/* KPI 3: Out of Stock / Unavailable */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#0f1b33] border border-slate-800 min-w-0">
          <div className="flex items-center justify-between text-slate-400 mb-2 sm:mb-3">
            <span className="text-xs font-semibold">Unavailable / 86&apos;d</span>
            <AlertCircle className={`w-4 h-4 shrink-0 ${unavailableDishesCount > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
              {unavailableDishesCount}
            </span>
            <button
              onClick={() => setDashboardTab('menu')}
              className="text-xs text-teal-400 hover:underline font-semibold"
            >
              Update items
            </button>
          </div>
          <div className="text-xs text-slate-400 mt-2 truncate">
            {unavailableDishesCount > 0
              ? 'Marked as sold out on live guest phones'
              : 'All items currently in stock'}
          </div>
        </div>

        {/* KPI 4: Most-Viewed Dish (Honest Engagement) */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#0f1b33] border border-slate-800 min-w-0">
          <div className="flex items-center justify-between text-slate-400 mb-2 sm:mb-3">
            <span className="text-xs font-semibold">Most-Viewed Dish</span>
            <Eye className="w-4 h-4 text-cyan-400 shrink-0" />
          </div>
          {mostViewedDish ? (
            <>
              <div className="text-sm sm:text-base font-bold text-white truncate" title={mostViewedDish.name}>
                {mostViewedDish.name}
              </div>
              <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
                <span>{mostViewedDish.category || 'Menu item'}</span>
                <span className="text-teal-400 font-mono font-semibold">
                  {mostViewedDish.views} detail view{mostViewedDish.views > 1 ? 's' : ''}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="text-xs sm:text-sm font-semibold text-slate-400">
                No dish views yet
              </div>
              <div className="text-[11px] text-slate-500 mt-2">
                Click a dish in the public menu to view details
              </div>
            </>
          )}
        </div>
      </div>

      {/* Menu Engagement Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-950/50 via-[#0d2238] to-[#0f1b33] p-4 sm:p-6 border border-teal-500/40 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2 max-w-3xl min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-400/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                Menu Engagement Intelligence
              </span>
              <span className="text-[10px] bg-slate-800 text-teal-300 px-2 py-0.5 rounded border border-slate-700">
                Live Local Storage
              </span>
            </div>
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-white break-words">
              {summary.totalVisits > 0 
                ? `${summary.totalVisits} menu visits and ${summary.totalDishViews} dish expansions recorded`
                : 'Customer interactions will appear as guests scan your QR code'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed break-words">
              Monitor popular searches, high-interest items, and category traffic without external tracking cookies or paid databases.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 shrink-0 w-full md:w-auto">
            <button
              onClick={() => setDashboardTab('insights')}
              className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-lg transition-colors whitespace-nowrap shadow-sm text-center flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Open AI Menu Insights</span>
            </button>
            <button
              onClick={() => setActiveView('customer-menu')}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap text-center"
            >
              Test Public Menu
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Section: Menu Overview & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left: Sample Menu Highlights */}
        <div className="lg:col-span-7 space-y-4 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Live Menu Highlights</h2>
              <p className="text-xs text-slate-400">Green Leaf Café Signature Selection</p>
            </div>
            <button
              onClick={() => setDashboardTab('menu')}
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 shrink-0"
            >
              <span>View All ({dishes.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {dishes.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-[#0f1b33] border border-slate-800 text-slate-400 text-xs">
                No menu dishes currently loaded. Click below to add dishes or reset the sample menu.
              </div>
            ) : (
              dishes.slice(0, 4).map((dish) => (
              <div
                key={dish.id}
                className="p-3 sm:p-4 rounded-xl bg-[#0f1b33] border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between gap-3 min-w-0"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {dish.image ? (
                    <img
                      src={dish.image}
                      alt={dish.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover border border-slate-700/80 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                      <Utensils className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[160px] sm:max-w-none">{dish.name}</span>
                      {dish.tags[0] && (
                        <span className="text-[10px] text-teal-300 bg-teal-950/80 border border-teal-800/60 px-1.5 py-0.2 rounded shrink-0">
                          {dish.tags[0]}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-400 truncate mt-0.5">{dish.description}</p>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-400 mt-1">
                      <span className="font-mono text-teal-300 font-semibold">₹{dish.price}</span>
                      <span aria-hidden="true">·</span>
                      <span>{dish.prepTime}</span>
                      <span aria-hidden="true">·</span>
                      <span className={dish.isAvailable ? 'text-emerald-400' : 'text-rose-400'}>
                        {dish.isAvailable ? 'Available' : 'Sold Out'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => setDashboardTab('menu')}
                    className="p-1.5 sm:p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-colors shrink-0"
                    title="Edit dish"
                  >
                    Edit
                  </button>
                </div>
              </div>
            )))}
          </div>

          <div className="pt-1">
            <button
              onClick={onOpenAddDish}
              className="w-full py-2.5 sm:py-3 rounded-xl border border-dashed border-slate-700 hover:border-teal-400/60 bg-[#0f1b33]/40 hover:bg-[#0f1b33] text-xs font-semibold text-slate-300 hover:text-teal-300 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 text-teal-400" />
              <span>Add New Dish to Menu</span>
            </button>
          </div>
        </div>

        {/* Right: Recent Activity Feed & Single QR Quick Card */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-6 min-w-0">
          {/* Quick QR Card (Single Restaurant QR) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0f1b33] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-teal-500/10 border border-teal-400/30 flex items-center justify-center text-teal-400 shrink-0">
                <QrCode className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-white truncate">Restaurant Digital Menu QR</h3>
                <p className="text-[11px] sm:text-xs text-slate-400 truncate">One permanent QR code for {restaurant.name}</p>
              </div>
            </div>
            <button
              onClick={() => setDashboardTab('qr-code')}
              className="w-full sm:w-auto px-3 py-1.5 sm:py-2 text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-lg transition-colors whitespace-nowrap text-center shrink-0"
            >
              QR Studio
            </button>
          </div>

          {/* Activity Feed with Real Interactions */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0f1b33] border border-slate-800">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-xs sm:text-sm font-bold text-white">Recent Guest Interactions</h3>
              <span className="text-[10px] text-teal-400 font-mono">Live In-Browser</span>
            </div>

            {summary.recentEvents.length === 0 ? (
              <div className="p-5 text-center rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 space-y-1.5">
                <p className="font-semibold text-slate-300">No customer activity yet</p>
                <p className="text-[11px] text-slate-500">
                  Visits, dish clicks, and searches will appear here live as guests explore.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {summary.recentEvents.slice(0, 5).map((evt) => (
                  <div key={evt.id} className="flex items-start gap-2.5 sm:gap-3 text-xs min-w-0">
                    <div className="w-2 h-2 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 leading-snug break-words">
                        {evt.type === 'menu_visit' && 'Guest opened public digital menu'}
                        {evt.type === 'dish_view' && `Guest viewed dish: ${evt.targetName}`}
                        {evt.type === 'search' && `Guest searched for: "${evt.targetName}"`}
                        {evt.type === 'category_select' && `Guest selected category: ${evt.targetName}`}
                      </p>
                      <span className="text-[10px] sm:text-[11px] text-slate-500 font-mono mt-0.5 block">
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
