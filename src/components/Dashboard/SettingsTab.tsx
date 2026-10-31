import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Store, 
  Wifi, 
  MapPin, 
  Clock, 
  DollarSign, 
  Check, 
  Utensils, 
  RefreshCw, 
  ShieldCheck, 
  LogIn, 
  UserPlus, 
  LogOut, 
  Key 
} from 'lucide-react';
import { RestaurantInfo, Dish, Category } from '../../types';
import { AuthModal } from '../AuthModal';
import { isSupabaseConfigured } from '../../supabase/client';
import { useSupabaseAuth } from '../../supabase/useSupabaseAuth';
import { saveRestaurantProfile } from '../../supabase/syncService';

interface SettingsTabProps {
  restaurant: RestaurantInfo;
  setRestaurant: React.Dispatch<React.SetStateAction<RestaurantInfo>>;
  dishes?: Dish[];
  categories?: Category[];
  onNotification?: (msg: string) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  restaurant,
  setRestaurant,
  onNotification,
}) => {
  const { user, signOut } = useSupabaseAuth();
  const [formData, setFormData] = useState<RestaurantInfo>({ ...restaurant });
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [syncStatusNote, setSyncStatusNote] = useState<string | null>(null);

  // Authentication Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    setFormData({ ...restaurant });
  }, [restaurant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSyncStatusNote(null);

    // Always update local React state and local storage
    setRestaurant(formData);

    // If authenticated with Supabase, sync to cloud
    if (user && isSupabaseConfigured) {
      try {
        const res = await saveRestaurantProfile(formData, user);
        if (res.success) {
          setSyncStatusNote('Saved to Supabase Cloud & Local Storage');
          if (onNotification) onNotification('Restaurant settings saved to Supabase cloud!');
        } else {
          setSyncStatusNote('Saved to local storage');
          if (onNotification) onNotification('Restaurant settings updated successfully!');
        }
      } catch {
        setSyncStatusNote('Saved to local storage');
        if (onNotification) onNotification('Settings updated in local storage.');
      }
    } else {
      setSyncStatusNote('Saved to local storage');
      if (onNotification) onNotification('Restaurant settings updated successfully!');
    }

    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-4xl w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Restaurant Settings</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your restaurant branding, contact details, operating hours, and guest Wi-Fi.
          </p>
        </div>

        {/* Storage status pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 self-start sm:self-auto">
          <span
            className={`w-2 h-2 rounded-full ${
              isSupabaseConfigured ? 'bg-emerald-400' : 'bg-teal-400'
            }`}
          />
          <span className="font-semibold text-white">
            {isSupabaseConfigured ? 'Cloud Sync Connected' : 'Browser Local Storage'}
          </span>
        </div>
      </div>

      <div className="space-y-5 w-full">
        {/* Restaurant Owner Authentication Card */}
        <section className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#0c182f] to-[#091224] border border-slate-800 shadow-md space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div 
                className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                  user 
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                    : isSupabaseConfigured 
                    ? 'bg-teal-400/20 border-teal-400/40 text-teal-300' 
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {user ? <ShieldCheck className="w-5 h-5" /> : <Key className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-white">
                    Restaurant Owner Authentication
                  </h2>
                  {user ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-700">
                      ● Signed In
                    </span>
                  ) : isSupabaseConfigured ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-800">
                      ○ Not Signed In
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-slate-400 border border-slate-700">
                      ○ Local Storage
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-0.5 truncate">
                  {user 
                    ? `Signed in as ${user.email} · Cloud synchronization active` 
                    : isSupabaseConfigured 
                    ? 'Sign in to access your cloud-hosted menu, sync changes across devices, and manage dishes' 
                    : 'Running in browser local storage. Changes are saved directly on this device.'}
                </p>
              </div>
            </div>

            {/* Action Buttons: Sign In / Create Account / Sign Out */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {user ? (
                <button
                  type="button"
                  onClick={async () => {
                    const res = await signOut();
                    if (res.success && onNotification) {
                      onNotification('Signed out successfully.');
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-800 text-xs text-rose-300 hover:text-rose-200 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              ) : isSupabaseConfigured ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode('signin');
                      setIsAuthModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-teal-500/20 transition-all cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode('signup');
                      setIsAuthModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs sm:text-sm font-semibold text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-teal-400" />
                    <span>Create Account</span>
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {/* Status note footer */}
          <div className="pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
            {user ? (
              <>
                <span>✓ All dish edits, availability toggles, and prices save automatically</span>
                <span>✓ Public QR menu always loads live published restaurant menu</span>
              </>
            ) : isSupabaseConfigured ? (
              <>
                <span>✓ Changes are preserved safely in browser storage until you sign in</span>
                <span className="text-teal-400">Sign in to sync your menu across devices</span>
              </>
            ) : (
              <>
                <span>✓ Offline local storage mode is active</span>
                <span>✓ Full menu editing and QR preview available</span>
              </>
            )}
          </div>
        </section>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 w-full">
            {/* Section 1: Brand & Profile */}
            <div className="p-4 sm:p-6 rounded-2xl bg-[#0f1b33] border border-slate-800 space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-xs sm:text-sm font-bold text-white">
              <Store className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Brand Profile & Concept</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Restaurant Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Cuisine Style
              </label>
              <input
                type="text"
                value={formData.cuisine}
                onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Tagline / Dietary Proposition
            </label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
            />
          </div>
        </div>

        {/* Section 2: Location & Timing */}
        <div className="p-4 sm:p-6 rounded-2xl bg-[#0f1b33] border border-slate-800 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-xs sm:text-sm font-bold text-white">
            <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
            <span>Location & Service Hours</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Street Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                City & State
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Opening Hours
              </label>
              <input
                type="text"
                value={formData.openingHours}
                onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Table Seating Count
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.tableCount}
                onChange={(e) => setFormData({ ...formData, tableCount: parseInt(e.target.value) || 10 })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Guest Wi-Fi */}
        <div className="p-4 sm:p-6 rounded-2xl bg-[#0f1b33] border border-slate-800 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-xs sm:text-sm font-bold text-white">
            <Wifi className="w-4 h-4 text-teal-400 shrink-0" />
            <span>Complimentary Guest Wi-Fi (Shown on QR Stand)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Wi-Fi Network SSID
              </label>
              <input
                type="text"
                value={formData.wifiSsid}
                onChange={(e) => setFormData({ ...formData, wifiSsid: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Wi-Fi Password
              </label>
              <input
                type="text"
                value={formData.wifiPass}
                onChange={(e) => setFormData({ ...formData, wifiPass: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
          {savedSuccess && syncStatusNote && (
            <span className="text-xs font-semibold text-teal-400 flex items-center justify-center gap-1.5 animate-in fade-in duration-200">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{syncStatusNote}</span>
            </span>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-2.5 text-xs sm:text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl transition-all shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
      </div>

      {/* Supabase Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onNotification={onNotification}
      />
    </div>
  );
};
