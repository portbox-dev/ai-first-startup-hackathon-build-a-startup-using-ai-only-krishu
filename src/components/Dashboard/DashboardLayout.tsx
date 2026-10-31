import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Sparkles, 
  QrCode, 
  BarChart3, 
  Settings, 
  ExternalLink, 
  ChevronRight, 
  Menu, 
  X, 
  Smartphone,
  ArrowLeft,
  CheckCircle2,
  BrainCircuit
} from 'lucide-react';
import { Dish, Category, RestaurantInfo, DashboardTab, ActiveView } from '../../types';
import { OverviewTab } from './OverviewTab';
import { MenuManagementTab } from './MenuManagementTab';
import { AIMenuInsightsTab } from './AIMenuInsightsTab';
import { AIMenuCreatorTab } from './AIMenuCreatorTab';
import { QRCodeTab } from './QRCodeTab';
import { AnalyticsTab } from './AnalyticsTab';
import { SettingsTab } from './SettingsTab';

interface DashboardLayoutProps {
  restaurant: RestaurantInfo;
  setRestaurant: React.Dispatch<React.SetStateAction<RestaurantInfo>>;
  categories: Category[];
  dishes: Dish[];
  setDishes: React.Dispatch<React.SetStateAction<Dish[]>>;
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  setActiveView: (view: ActiveView) => void;
  cloudRestaurantId?: string | null;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  restaurant,
  setRestaurant,
  categories,
  dishes,
  setDishes,
  activeTab,
  setActiveTab,
  setActiveView,
  cloudRestaurantId,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const navItems: { id: DashboardTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'menu', label: 'My Menu', icon: UtensilsCrossed },
    { id: 'insights', label: 'AI Menu Insights', icon: BrainCircuit },
    { id: 'ai-creator', label: 'AI Menu Creator', icon: Sparkles },
    { id: 'qr-code', label: 'QR Code Studio', icon: QrCode },
    { id: 'analytics', label: 'Menu Engagement', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-full max-w-full min-h-screen bg-[#080e1a] text-slate-100 flex flex-col md:flex-row overflow-x-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-teal-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs sm:text-sm animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3.5 bg-[#0b1326] border-b border-slate-800 sticky top-0 z-40 w-full max-w-full">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-200 shrink-0"
            aria-label="Toggle navigation"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
            <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[130px] sm:max-w-none">
              {restaurant.name}
            </span>
          </div>
        </div>

        <button
          onClick={() => setActiveView('customer-menu')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 text-xs font-bold text-slate-950 bg-teal-400 rounded-lg whitespace-nowrap shrink-0"
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden xs:inline">Customer </span>
          <span>Menu</span>
        </button>
      </div>

      {/* Backdrop overlay when mobile menu is open */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-30 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 max-w-[85vw] bg-[#091122] border-r border-slate-800/90 flex flex-col justify-between z-40 transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 sm:p-5 overflow-y-auto">
          {/* Restaurant Brand Identity in Sidebar */}
          <div className="pb-4 sm:pb-5 border-b border-slate-800/80 mb-4 sm:mb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-teal-400 text-slate-950 flex items-center justify-center font-black text-sm shrink-0">
                  GL
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-sm text-white tracking-tight leading-tight truncate">
                    {restaurant.name}
                  </h2>
                  <span className="text-[10px] text-teal-400 font-medium">Bistro Dashboard</span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="md:hidden text-slate-400 hover:text-white p-1"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Nav links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-teal-400/10 text-teal-300 border border-teal-500/30 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </div>
                  {item.id === 'ai-creator' && (
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
                      AI
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-3 sm:p-4 border-t border-slate-800/80 space-y-2">
          <button
            onClick={() => {
              setActiveView('customer-menu');
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 px-3 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs transition-colors shadow-sm shadow-teal-500/20"
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span>Open Customer Menu</span>
          </button>

          <button
            onClick={() => {
              setActiveView('landing');
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 text-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            <span>Back to SmartMenu Home</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 min-w-0 max-w-full p-3 sm:p-6 lg:p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full">
          {activeTab === 'overview' && (
            <OverviewTab
              restaurant={restaurant}
              dishes={dishes}
              setDashboardTab={setActiveTab}
              setActiveView={setActiveView}
              onOpenAddDish={() => {
                setActiveTab('menu');
                setIsAddModalOpen(true);
              }}
            />
          )}

          {activeTab === 'menu' && (
            <MenuManagementTab
              restaurant={restaurant}
              categories={categories}
              dishes={dishes}
              setDishes={setDishes}
              isAddModalOpen={isAddModalOpen}
              setIsAddModalOpen={setIsAddModalOpen}
              onNotification={showToast}
              setActiveView={setActiveView}
              cloudRestaurantId={cloudRestaurantId}
            />
          )}

          {activeTab === 'insights' && (
            <AIMenuInsightsTab
              restaurant={restaurant}
              dishes={dishes}
              categories={categories}
              setActiveTab={setActiveTab}
              setActiveView={setActiveView}
              onOpenAddDish={() => {
                setActiveTab('menu');
                setIsAddModalOpen(true);
              }}
            />
          )}

          {activeTab === 'ai-creator' && (
            <AIMenuCreatorTab
              categories={categories}
              setDishes={setDishes}
              setActiveTab={setActiveTab}
              setActiveView={setActiveView}
              onDishAddedNotification={(count) => {
                showToast(`${count} new dish${count > 1 ? 'es' : ''} added to your menu!`);
              }}
            />
          )}

          {activeTab === 'qr-code' && (
            <QRCodeTab restaurant={restaurant} setActiveView={setActiveView} />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsTab 
              restaurant={restaurant} 
              setActiveView={setActiveView} 
              setActiveTab={setActiveTab}
              cloudRestaurantId={cloudRestaurantId}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              restaurant={restaurant}
              setRestaurant={setRestaurant}
              dishes={dishes}
              categories={categories}
              onNotification={showToast}
            />
          )}
        </div>
      </main>
    </div>
  );
};
