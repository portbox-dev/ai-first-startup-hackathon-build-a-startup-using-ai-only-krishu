import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  TrendingUp, 
  Search, 
  Layers, 
  Eye, 
  ArrowRight, 
  ExternalLink, 
  Utensils, 
  ShieldCheck,
  Zap,
  HelpCircle
} from 'lucide-react';
import { Dish, Category, RestaurantInfo, DashboardTab, ActiveView } from '../../types';
import { generateMenuInsights, InsightsResult, MenuInsight } from '../../data/insightsEngine';
import { seedDemoEngagementEvents, clearAnalytics } from '../../data/analyticsStore';

interface AIMenuInsightsTabProps {
  restaurant: RestaurantInfo;
  dishes: Dish[];
  categories: Category[];
  setActiveTab: (tab: DashboardTab) => void;
  setActiveView: (view: ActiveView) => void;
  onOpenAddDish?: () => void;
}

export const AIMenuInsightsTab: React.FC<AIMenuInsightsTabProps> = ({
  restaurant,
  dishes,
  categories,
  setActiveTab,
  setActiveView,
  onOpenAddDish,
}) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [insightsResult, setInsightsResult] = useState<InsightsResult>(() =>
    generateMenuInsights(restaurant, dishes, categories)
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleGenerateInsights = () => {
    setIsGenerating(true);
    // Provide responsive feedback while running local analytical pass
    setTimeout(() => {
      const freshResult = generateMenuInsights(restaurant, dishes, categories);
      setInsightsResult(freshResult);
      setIsGenerating(false);
      showToast('Menu insights recalculated from latest analytics.');
    }, 500);
  };

  // Re-run whenever dishes or restaurant changes
  useEffect(() => {
    const freshResult = generateMenuInsights(restaurant, dishes, categories);
    setInsightsResult(freshResult);
  }, [restaurant, dishes, categories]);

  const handleLoadDemoData = () => {
    seedDemoEngagementEvents(restaurant.name);
    setTimeout(() => {
      const freshResult = generateMenuInsights(restaurant, dishes, categories);
      setInsightsResult(freshResult);
      showToast('Loaded demo activity for insight calculation.');
    }, 200);
  };

  const handleClearData = () => {
    if (window.confirm('Clear all recorded interactions for this restaurant?')) {
      clearAnalytics(restaurant.name);
      setTimeout(() => {
        const freshResult = generateMenuInsights(restaurant, dishes, categories);
        setInsightsResult(freshResult);
        showToast('Analytics cleared.');
      }, 200);
    }
  };

  const getSeverityStyle = (severity: MenuInsight['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-rose-950/20 border-rose-800/80',
          badge: 'bg-rose-950 text-rose-300 border-rose-800',
          icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
        };
      case 'warning':
        return {
          bg: 'bg-amber-950/20 border-amber-800/80',
          badge: 'bg-amber-950 text-amber-300 border-amber-800',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
        };
      case 'positive':
        return {
          bg: 'bg-emerald-950/20 border-emerald-800/80',
          badge: 'bg-emerald-950 text-emerald-300 border-emerald-800',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
        };
      case 'info':
      default:
        return {
          bg: 'bg-teal-950/20 border-teal-800/80',
          badge: 'bg-teal-950 text-teal-300 border-teal-800',
          icon: <Info className="w-5 h-5 text-teal-400 shrink-0" />,
        };
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-teal-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs sm:text-sm animate-in slide-in-from-top-4 duration-200 max-w-[calc(100vw-2rem)]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="break-words leading-tight">{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 w-full min-w-0">
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-950/80 border border-teal-800/60 text-teal-300 text-xs font-semibold mb-1.5 sm:mb-2 max-w-full">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">AI Menu Insights · Rule-Based Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight break-words">
            AI Menu Insights & Optimization
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 break-words">
            Actionable culinary observations, customer search demand, and availability recommendations computed from live browsing activity.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleGenerateInsights}
            disabled={isGenerating}
            className="px-3.5 sm:px-4 py-2 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 active:scale-95 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-teal-500/20 flex items-center gap-2 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Generating Insights...' : 'Generate Insights'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('customer-menu')}
            className="px-3 sm:px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap"
            title="Open customer menu in new view"
          >
            <ExternalLink className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>Test Customer Menu</span>
          </button>
        </div>
      </div>

      {/* 2. Analytical Engine Architecture Banner */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-teal-950/40 via-[#0d1e38] to-[#0f1b33] border border-teal-500/30 text-xs text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full max-w-full min-w-0">
        <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 w-full sm:w-auto flex-1">
          <div className="w-8 h-8 rounded-lg bg-teal-400/20 border border-teal-400/40 text-teal-300 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <Zap className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <span className="font-bold text-white text-xs break-words">
                {insightsResult.engineLabel}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-900 border border-slate-700 text-teal-300 shrink-0 inline-flex items-center">
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 break-words leading-relaxed whitespace-normal">
              {insightsResult.summaryNote}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 shrink-0 self-start sm:self-auto font-mono bg-slate-950/40 px-2.5 py-1 rounded-lg border border-slate-800/80">
          <span>{insightsResult.sampleSize} interactions analyzed</span>
        </div>
      </div>

      {/* 3. Core Interaction Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 w-full min-w-0">
        <div className="p-3.5 sm:p-4 rounded-xl bg-[#0f1b33] border border-slate-800 min-w-0">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="truncate mr-1">Menu Visits</span>
            <Eye className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-white tabular-nums">
            {insightsResult.totalVisits}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 truncate">Sessions recorded</div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-[#0f1b33] border border-slate-800 min-w-0">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="truncate mr-1">Dish Detail Clicks</span>
            <Utensils className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-white tabular-nums">
            {insightsResult.totalDishViews}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 truncate">Dishes expanded</div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-[#0f1b33] border border-slate-800 min-w-0">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="truncate mr-1">Search Queries</span>
            <Search className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-white tabular-nums">
            {insightsResult.totalSearches}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 truncate">Keywords typed</div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-[#0f1b33] border border-slate-800 min-w-0">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="truncate mr-1">Category Clicks</span>
            <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-white tabular-nums">
            {insightsResult.totalCategoryClicks}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 truncate">Course tabs opened</div>
        </div>
      </div>

      {/* 4. Loading State */}
      {isGenerating && (
        <div className="p-8 sm:p-12 rounded-2xl bg-[#0f1b33] border border-slate-800 text-center space-y-3 animate-in fade-in duration-200">
          <div className="w-10 h-10 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <h3 className="text-sm sm:text-base font-bold text-white">
            Analyzing Menu Interaction Data...
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Cross-referencing dish view frequencies, customer searches, and kitchen availability for {restaurant.name}.
          </p>
        </div>
      )}

      {/* 5. Empty State (When no interaction data exists) */}
      {!isGenerating && insightsResult.status === 'empty' && (
        <div className="p-8 sm:p-12 rounded-2xl bg-[#0f1b33] border border-slate-800 text-center space-y-4 max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto">
            <HelpCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-bold text-white">
              More Customer Interactions Needed
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
              SmartMenu generates insights from actual recorded customer activity. No customer interactions have been logged in this browser yet. Open your public menu to view dishes, click categories, or run searches to generate real data.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setActiveView('customer-menu')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-teal-500/20 flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Customer Menu to Generate Activity</span>
            </button>

            <button
              type="button"
              onClick={handleLoadDemoData}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Explore Sample Demo Insights
            </button>
          </div>
        </div>
      )}

      {/* 6. Preliminary Data Banner (When < 5 events exist) */}
      {!isGenerating && insightsResult.status === 'preliminary' && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full min-w-0">
          <div className="flex items-start sm:items-center gap-2 min-w-0 flex-1">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <span className="break-words leading-relaxed">
              <strong>Preliminary Insights:</strong> Only {insightsResult.sampleSize} interactions have been recorded. Findings represent early trends and will become more statistically reliable as more guests explore your menu.
            </span>
          </div>

          <button
            type="button"
            onClick={handleLoadDemoData}
            className="text-xs font-bold text-amber-300 hover:underline shrink-0 self-end sm:self-auto"
          >
            Load Full Demo Set
          </button>
        </div>
      )}

      {/* 7. Generated Insights Cards */}
      {!isGenerating && insightsResult.insights.length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-300 w-full min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
            <h3 className="text-sm sm:text-base font-bold text-white break-words">
              Data-Backed Observations & Recommendations ({insightsResult.insights.length})
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Updated {new Date(insightsResult.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
            {insightsResult.insights.map((insight) => {
              const style = getSeverityStyle(insight.severity);
              return (
                <div
                  key={insight.id}
                  className={`p-4 sm:p-5 rounded-2xl border ${style.bg} flex flex-col justify-between transition-all space-y-4 min-w-0 w-full overflow-hidden`}
                >
                  <div className="space-y-2.5 min-w-0">
                    {/* Top Row: Category Badge + Severity Icon */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${style.badge} shrink-0`}>
                        {insight.category}
                      </span>
                      {style.icon}
                    </div>

                    {/* Title */}
                    <h4 className="text-sm sm:text-base font-bold text-white leading-snug break-words">
                      {insight.title}
                    </h4>

                    {/* Observation */}
                    <p className="text-xs text-slate-300 leading-relaxed break-words">
                      {insight.observation}
                    </p>

                    {/* Evidence Box */}
                    <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-400 break-words overflow-hidden">
                      <span className="text-slate-500 font-sans font-semibold">Evidence: </span>
                      <span className="text-slate-300 break-all">{insight.evidence}</span>
                    </div>

                    {/* Recommendation */}
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-1 min-w-0">
                      <span className="text-[10px] uppercase font-bold text-teal-400 block tracking-wider">
                        Actionable Recommendation:
                      </span>
                      <p className="leading-relaxed break-words">
                        {insight.recommendation}
                      </p>
                    </div>
                  </div>

                  {/* Action Link / Button */}
                  {insight.actionTab && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => setActiveTab(insight.actionTab!)}
                        className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors break-words text-right"
                      >
                        <span>{insight.actionText || 'Take Action in Dashboard'}</span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 8. Technical & Architectural Disclosure (Requirement 3 & 4) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-start gap-3.5 w-full min-w-0">
        <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
        <div className="space-y-1.5 leading-relaxed min-w-0 flex-1">
          <h4 className="font-bold text-slate-300 text-xs">
            About SmartMenu AI Menu Insights Engine
          </h4>
          <p className="text-[11px] text-slate-400 break-words">
            SmartMenu utilizes a transparent rule-based analytics engine that reads customer interactions directly from <code className="text-teal-300 font-mono break-all bg-slate-950 px-1 py-0.5 rounded">smartmenu_analytics_green-leaf-caf-</code>, dish records from <code className="text-teal-300 font-mono break-all bg-slate-950 px-1 py-0.5 rounded">smartmenu_dishes</code>, and settings from <code className="text-teal-300 font-mono break-all bg-slate-950 px-1 py-0.5 rounded">smartmenu_restaurant</code> in browser localStorage.
          </p>
          <div className="text-[10px] text-slate-500 pt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span>✓ Zero Paid API Dependencies</span>
            <span>✓ No Sales or Orders Claimed</span>
            <span>✓ 100% In-Browser Privacy</span>
            <span>✓ Restaurant Owner Retains Full Editing Control</span>
          </div>
        </div>
      </div>
    </div>
  );
};
