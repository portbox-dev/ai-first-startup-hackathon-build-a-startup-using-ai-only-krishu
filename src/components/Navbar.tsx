import React, { useState } from 'react';
import { UtensilsCrossed, Smartphone, LayoutDashboard, Menu, X, ArrowRight } from 'lucide-react';
import { ActiveView } from '../types';

interface NavbarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeView, setActiveView }) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    setActiveView('landing');
    setIsMobileNavOpen(false);
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <header className="sticky top-0 z-50 w-full max-w-full bg-[#080e1a]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4 md:gap-8 min-w-0">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => {
            setActiveView('landing');
            setIsMobileNavOpen(false);
          }}
          className="flex items-center gap-2 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-md shrink-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-teal-400 to-teal-700 flex items-center justify-center text-slate-950 shadow-sm shadow-teal-500/20 group-hover:scale-105 transition-transform duration-200 shrink-0">
            <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap">
              SmartMenu
            </span>
          </div>
        </button>

        {/* Zone 2: Desktop Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-7 text-sm font-medium text-slate-300">
          <button
            onClick={() => handleNavClick('features')}
            className="hover:text-teal-400 transition-colors whitespace-nowrap"
          >
            Features
          </button>
          <button
            onClick={() => handleNavClick('how-it-works')}
            className="hover:text-teal-400 transition-colors whitespace-nowrap"
          >
            How It Works
          </button>
          <button
            onClick={() => handleNavClick('pricing')}
            className="hover:text-teal-400 transition-colors whitespace-nowrap"
          >
            Pricing
          </button>
          <button
            onClick={() => setActiveView('customer-menu')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeView === 'customer-menu' ? 'text-teal-400 font-semibold' : 'hover:text-teal-400'
            }`}
          >
            <Smartphone className="w-4 h-4 text-teal-400" />
            Customer Menu
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action + Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {activeView !== 'dashboard' ? (
            <button
              onClick={() => {
                setActiveView('dashboard');
                setIsMobileNavOpen(false);
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 active:scale-[0.98] rounded-lg transition-all shadow-sm shadow-teal-500/20 whitespace-nowrap shrink-0"
            >
              <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline">Restaurant </span>
              <span>Dashboard</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setActiveView('customer-menu');
                setIsMobileNavOpen(false);
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 active:scale-[0.98] rounded-lg transition-all shadow-sm shadow-teal-500/20 whitespace-nowrap shrink-0"
            >
              <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline">Preview </span>
              <span>Menu</span>
            </button>
          )}

          {/* Mobile menu toggle button */}
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="md:hidden p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Toggle navigation menu"
          >
            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {isMobileNavOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#091122] px-4 py-3 space-y-2 animate-in slide-in-from-top-2 duration-150">
          <button
            onClick={() => handleNavClick('features')}
            className="w-full text-left py-2 px-2.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-teal-300 hover:bg-slate-800/60 transition-colors"
          >
            Features
          </button>
          <button
            onClick={() => handleNavClick('how-it-works')}
            className="w-full text-left py-2 px-2.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-teal-300 hover:bg-slate-800/60 transition-colors"
          >
            How It Works
          </button>
          <button
            onClick={() => handleNavClick('pricing')}
            className="w-full text-left py-2 px-2.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-teal-300 hover:bg-slate-800/60 transition-colors"
          >
            Pricing
          </button>
          <button
            onClick={() => {
              setActiveView('customer-menu');
              setIsMobileNavOpen(false);
            }}
            className="w-full text-left py-2 px-2.5 rounded-lg text-xs font-semibold text-teal-400 hover:bg-slate-800/60 transition-colors flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <Smartphone className="w-3.5 h-3.5" />
              Customer Menu Preview
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </header>
  );
};
