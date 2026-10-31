import React from 'react';
import heroSmartMenuImg from '../assets/images/hero_smart_menu_1791823978109.jpg';
import { 
  Sparkles, 
  QrCode, 
  Compass, 
  BarChart3, 
  ArrowRight, 
  Check, 
  Smartphone, 
  Layers, 
  Zap, 
  ShieldCheck, 
  Star,
  Clock,
  ChevronRight
} from 'lucide-react';
import { ActiveView } from '../types';

interface LandingPageProps {
  setActiveView: (view: ActiveView) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ setActiveView }) => {
  return (
    <div className="w-full max-w-full min-h-screen bg-[#080e1a] text-slate-100 flex flex-col overflow-x-hidden selection:bg-teal-500/30 selection:text-teal-200">
      {/* Hero Section */}
      <section className="relative w-full max-w-full pt-8 pb-14 sm:pt-16 sm:pb-20 md:pt-20 md:pb-28 overflow-hidden">
        {/* Subtle radial glow (contained with max-w-full) */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[600px] h-[300px] sm:h-[400px] bg-teal-500/10 blur-[100px] sm:blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-1/2 right-0 w-[60vw] max-w-[400px] h-[250px] sm:h-[300px] bg-cyan-600/5 blur-[80px] sm:blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
            {/* Left Column: Hero Text */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6 min-w-0">
              <div className="inline-flex flex-wrap items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 rounded-full bg-slate-900 border border-teal-500/30 text-teal-300 text-[11px] sm:text-xs font-semibold tracking-wide max-w-full">
                <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Next-Gen Dining Technology · Multi-Restaurant Platform</span>
              </div>

              <h1 className="text-[clamp(1.85rem,6.5vw,3.75rem)] font-extrabold tracking-tight text-white leading-[1.12] break-words [text-wrap:balance]">
                Turn Your Menu Into a{' '}
                <span className="bg-gradient-to-r from-teal-300 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  Smart Experience.
                </span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl leading-relaxed break-words [text-wrap:balance]">
                The AI-powered digital menu platform for forward-thinking restaurants. Generate dynamic contactless QR codes, update kitchen availability in real-time, and let guests discover food with personalized recommendations.
              </p>

              {/* Responsive CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2 w-full sm:w-auto">
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="w-full sm:w-auto px-5 py-3 sm:px-6 sm:py-3.5 text-xs sm:text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 active:scale-[0.98] rounded-xl transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <span>Get Started — Dashboard</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>

                <button
                  onClick={() => setActiveView('customer-menu')}
                  className="w-full sm:w-auto px-5 py-3 sm:px-6 sm:py-3.5 text-xs sm:text-sm font-semibold text-slate-200 bg-slate-900/90 hover:bg-slate-800/90 hover:text-white border border-slate-700/80 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Smartphone className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>View Customer Demo</span>
                </button>
              </div>

              {/* Feature Highlights Strip */}
              <div className="pt-5 sm:pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-2 sm:gap-6 text-slate-400 text-xs sm:text-sm text-center sm:text-left">
                <div className="min-w-0">
                  <div className="text-sm sm:text-lg font-bold text-teal-300 truncate">Instant Access</div>
                  <div className="text-slate-400 text-[10px] sm:text-xs leading-tight">No App Install Required</div>
                </div>
                <div className="min-w-0">
                  <div className="text-sm sm:text-lg font-bold text-white truncate">Live Kitchen Sync</div>
                  <div className="text-slate-400 text-[10px] sm:text-xs leading-tight">Instant Availability Updates</div>
                </div>
                <div className="min-w-0">
                  <div className="text-sm sm:text-lg font-bold text-white truncate">Universal QR</div>
                  <div className="text-slate-400 text-[10px] sm:text-xs leading-tight">Camera-Ready Display Stands</div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Showcase */}
            <div className="lg:col-span-5 relative w-full">
              <div className="relative rounded-2xl overflow-hidden border border-slate-700/70 shadow-2xl shadow-slate-950/80 bg-slate-900 group w-full">
                <img
                  src={heroSmartMenuImg}
                  alt="Modern restaurant guest browsing SmartMenu on phone at fine dining table"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-cover rounded-2xl group-hover:scale-[1.02] transition-transform duration-500"
                />
                
                {/* Overlay live simulation card */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-4 sm:left-4 sm:right-4 p-3 sm:p-4 rounded-xl bg-[#0b132b]/95 backdrop-blur-md border border-teal-500/30 text-white shadow-xl">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-4">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
                        <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] sm:text-xs font-semibold text-slate-300 truncate">Green Leaf Café · Digital Menu</div>
                        <div className="text-xs sm:text-sm font-bold text-white truncate">Contactless Guest Session Active</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveView('customer-menu')}
                      className="w-full sm:w-auto px-3 py-1.5 text-xs font-semibold bg-teal-400 text-slate-950 rounded-lg hover:bg-teal-300 transition-colors whitespace-nowrap shrink-0 text-center"
                    >
                      Open Live
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section id="features" className="py-14 sm:py-20 bg-[#0b1326] border-y border-slate-800/80 relative w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10 sm:mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-400 mb-2">Core Platform Modules</h2>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight break-words [text-wrap:balance]">
              Built for speed in the kitchen, built for delight at the table.
            </h3>
            <p className="mt-3 text-sm sm:text-base text-slate-300">
              SmartMenu gives restaurant operators total control over their menus while offering guests an interactive dining companion.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Feature 1: AI Menu Creation */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#0f1b33] border border-slate-800 hover:border-teal-500/40 transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-3 sm:space-y-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:bg-teal-500/20 transition-colors">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-teal-300 transition-colors">
                  AI Menu Creation
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Turn raw chef notes, ingredient lists, or seasonal ideas into categorized dishes with flavorful descriptions and pricing suggestions in seconds.
                </p>
              </div>
              <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-slate-800/80 text-xs text-teal-400 font-semibold flex items-center gap-1">
                <span>Try Creator in Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 2: QR Menus */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#0f1b33] border border-slate-800 hover:border-teal-500/40 transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-3 sm:space-y-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:bg-teal-500/20 transition-colors">
                  <QrCode className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-teal-300 transition-colors">
                  Branded Digital Menu QR
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Generate high-contrast scannable QR codes for your restaurant. Ready-to-print display stands and table cards that open your live menu instantly without app downloads.
                </p>
              </div>
              <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-slate-800/80 text-xs text-teal-400 font-semibold flex items-center gap-1">
                <span>Display Stand Templates</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 3: Smart Recommendations */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#0f1b33] border border-slate-800 hover:border-teal-500/40 transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-3 sm:space-y-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:bg-teal-500/20 transition-colors">
                  <Compass className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-teal-300 transition-colors">
                  Smart Recommendations
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Guests tap &quot;What should I eat?&quot; to receive tailored suggestions based on their hunger, mood, spice tolerance, and vegan dietary preferences.
                </p>
              </div>
              <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-slate-800/80 text-xs text-teal-400 font-semibold flex items-center gap-1">
                <span>Interactive Food Sommelier</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 4: Analytics */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#0f1b33] border border-slate-800 hover:border-teal-500/40 transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-3 sm:space-y-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:bg-teal-500/20 transition-colors">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-teal-300 transition-colors">
                  Dining Analytics
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Track scan volume by hour, identify your most viewed signature dishes, and detect menu bottlenecks with real-time operational insights.
                </p>
              </div>
              <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-slate-800/80 text-xs text-teal-400 font-semibold flex items-center gap-1">
                <span>Interactive Demo Metrics</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-14 sm:py-20 bg-[#080e1a] w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-400 mb-2">Simple 3-Step Setup</h2>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight break-words [text-wrap:balance]">
              From kitchen ideas to tableside scans in 5 minutes
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative">
            {/* Step 1 */}
            <div className="p-5 sm:p-8 rounded-2xl bg-[#0f1b33]/60 border border-slate-800 flex flex-col relative">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-400 text-slate-950 font-black text-base sm:text-lg flex items-center justify-center mb-4 sm:mb-6 shadow-md shadow-teal-500/20">
                1
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-white mb-2">Build or Generate Menu</h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Add dishes with pricing, allergen tags, and high-resolution food photography. Use the AI Menu Creator to auto-format entire categories effortlessly.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 sm:p-8 rounded-2xl bg-[#0f1b33]/60 border border-slate-800 flex flex-col relative">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-400 text-slate-950 font-black text-base sm:text-lg flex items-center justify-center mb-4 sm:mb-6 shadow-md shadow-teal-500/20">
                2
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-white mb-2">Download Table QR Codes</h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Generate crisp, high-contrast QR codes ready for immediate display. Print ready-made table stands, counter cards, or stickers that work seamlessly across all tables.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 sm:p-8 rounded-2xl bg-[#0f1b33]/60 border border-slate-800 flex flex-col relative">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-400 text-slate-950 font-black text-base sm:text-lg flex items-center justify-center mb-4 sm:mb-6 shadow-md shadow-teal-500/20">
                3
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-white mb-2">Delight Guests & Update Live</h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Guests scan and browse on mobile. When an item runs out in the kitchen, mark it unavailable with a single tap to instantly update all tables.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-14 sm:py-20 bg-[#0b1326] border-y border-slate-800/80 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-400 mb-2">Transparent Plans</h2>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight break-words [text-wrap:balance]">
              Predictable pricing for single cafés to restaurant chains
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {/* Plan 1: Free */}
            <div className="p-5 sm:p-8 rounded-2xl bg-[#0f1b33] border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-xs sm:text-sm font-semibold text-slate-400 mb-1">Starter Food Trucks & Popups</div>
                <h4 className="text-xl sm:text-2xl font-bold text-white">Free Plan</h4>
                <div className="mt-3 mb-5 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tabular-nums">₹0</span>
                  <span className="text-xs sm:text-sm text-slate-400">/month forever</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mb-5">
                  Essential digital presence for small cafés or single food trucks testing contactless QR dining.
                </p>
                <div className="space-y-2.5 sm:space-y-3 pt-5 border-t border-slate-800 text-xs sm:text-sm text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>1 Digital Menu & up to 30 dishes</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Standard QR Code generation</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Real-time availability toggles</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-500">
                    <span className="line-through">AI Menu Creator assistance</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveView('dashboard')}
                className="mt-6 sm:mt-8 w-full py-2.5 sm:py-3 px-4 text-xs sm:text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-center"
              >
                Launch Free Menu
              </button>
            </div>

            {/* Plan 2: Pro (Featured) */}
            <div className="p-5 sm:p-8 rounded-2xl bg-gradient-to-b from-[#132342] to-[#0f1b33] border-2 border-teal-400 shadow-xl shadow-teal-500/10 flex flex-col justify-between relative mt-2 lg:mt-0">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-teal-400 text-slate-950 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider shadow-sm whitespace-nowrap">
                Most Popular for Dining
              </div>
              <div>
                <div className="text-xs sm:text-sm font-semibold text-teal-300 mb-1">Independent Cafés & Bistros</div>
                <h4 className="text-xl sm:text-2xl font-bold text-white">Pro Plan</h4>
                <div className="mt-3 mb-5 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tabular-nums">₹899</span>
                  <span className="text-xs sm:text-sm text-slate-400">/month billed monthly</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mb-5">
                  Complete restaurant management with AI dish recommendations and customized table QR stands.
                </p>
                <div className="space-y-2.5 sm:space-y-3 pt-5 border-t border-slate-700/80 text-xs sm:text-sm text-slate-200">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Unlimited dishes & categories</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>AI Menu Creator with auto-descriptions</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>&quot;What should I eat?&quot; AI Sommelier for guests</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Branded display stands & printable counter cards</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Weekly guest view analytics & insights</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveView('dashboard')}
                className="mt-6 sm:mt-8 w-full py-2.5 sm:py-3 px-4 text-xs sm:text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl transition-all shadow-md shadow-teal-500/20 text-center"
              >
                Start Pro Demo Now
              </button>
            </div>

            {/* Plan 3: Business */}
            <div className="p-5 sm:p-8 rounded-2xl bg-[#0f1b33] border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-xs sm:text-sm font-semibold text-slate-400 mb-1">Multi-Outlet Chains & Hospitality</div>
                <h4 className="text-xl sm:text-2xl font-bold text-white">Business Plan</h4>
                <div className="mt-3 mb-5 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tabular-nums">₹1,299</span>
                  <span className="text-xs sm:text-sm text-slate-400">/month billed monthly</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mb-5">
                  Enterprise-scale menu orchestration across multiple dining branches and hotel restaurant groups.
                </p>
                <div className="space-y-2.5 sm:space-y-3 pt-5 border-t border-slate-800 text-xs sm:text-sm text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Multi-location branch menu sync</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Custom domain & custom branding</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Advanced kitchen peak-hour heatmaps</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Priority 24/7 dedicated account manager</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveView('dashboard')}
                className="mt-6 sm:mt-8 w-full py-2.5 sm:py-3 px-4 text-xs sm:text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-center"
              >
                Contact Sales Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Experience Spotlight Preview */}
      <section className="py-14 sm:py-20 bg-[#080e1a] w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#0d1f38] via-[#0f2847] to-[#0a182b] p-5 sm:p-8 md:p-12 border border-teal-500/30 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
            <div className="space-y-3 sm:space-y-4 max-w-xl min-w-0">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">Live Prototype</span>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white break-words">
                Experience the Green Leaf Café Menu as a Guest
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Test the mobile-first customer interface with pure vegetarian dishes, search filters, dietary tags, and the interactive food recommendation assistant.
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 w-full sm:w-auto">
                <button
                  onClick={() => setActiveView('customer-menu')}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <span>Launch Customer Menu</span>
                </button>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white bg-slate-800/80 rounded-xl transition-all text-center"
                >
                  Go to Restaurant Dashboard
                </button>
              </div>
            </div>

            {/* Live Interactive Highlights */}
            <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-700/60 max-w-md w-full space-y-3">
              <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Interactive Demo Features</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                  <span>Real-time dish availability toggle directly on mobile</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                  <span>Interactive &quot;What should I eat?&quot; dish recommendation wizard</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                  <span>Dietary filters for Pure Veg, Vegan, Gluten-Free &amp; Spice levels</span>
                </li>
              </ul>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                <span>Sample dining data configured for live platform testing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 sm:py-12 bg-[#060a14] border-t border-slate-800 text-slate-400 text-xs w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-teal-500 flex items-center justify-center text-slate-950 font-bold text-xs shrink-0">
              SM
            </div>
            <span className="font-bold text-xs sm:text-sm text-white">SmartMenu</span>
            <span className="text-slate-600">·</span>
            <span className="text-[11px] sm:text-xs">AI-Powered Digital Menus</span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 text-xs">
            <button onClick={() => setActiveView('landing')} className="hover:text-white transition-colors">
              Home
            </button>
            <button onClick={() => setActiveView('dashboard')} className="hover:text-white transition-colors">
              Dashboard
            </button>
            <button onClick={() => setActiveView('customer-menu')} className="hover:text-white transition-colors">
              Customer Menu
            </button>
          </div>

          <div className="text-[11px] text-slate-500">
            <span>© 2026 SmartMenu Inc. Built for hospitality innovation.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
