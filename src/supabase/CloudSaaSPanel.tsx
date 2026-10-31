import React, { useState } from 'react';
import { 
  Cloud, 
  Database, 
  Key, 
  Lock, 
  Check, 
  Copy, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  RefreshCw, 
  LogIn, 
  UserPlus, 
  LogOut, 
  UploadCloud, 
  ShieldCheck, 
  Terminal,
  FileCode,
  Shield,
  Layers
} from 'lucide-react';
import { 
  isSupabaseConfigured, 
  getSupabaseConfigInfo, 
  checkDatabaseSchemaStatus, 
  SupabaseHealthCheckResult 
} from './client';
import { useSupabaseAuth } from './useSupabaseAuth';
import { SUPABASE_SQL_SCHEMA } from './sqlSchemaContent';
import { migrateLocalDataToCloud, MigrationSummary, fetchCloudTableCounts, CloudTableCounts } from './syncService';
import { RestaurantInfo, Dish, Category } from '../types';

interface CloudSaaSPanelProps {
  restaurant: RestaurantInfo;
  dishes: Dish[];
  categories: Category[];
  onNotification?: (msg: string) => void;
}

export const CloudSaaSPanel: React.FC<CloudSaaSPanelProps> = ({
  restaurant,
  dishes,
  categories,
  onNotification,
}) => {
  const configInfo = getSupabaseConfigInfo();
  const { user, isLoading: authLoading, isConfigured, signIn, signUp, signOut } = useSupabaseAuth();

  // Test connection & schema state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<SupabaseHealthCheckResult | null>(null);

  // Live Supabase table row counts state
  const [tableCounts, setTableCounts] = useState<CloudTableCounts | null>(null);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);

  // Copy SQL state
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  // Auth form state
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);

  // Migration state & in-app confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStep, setMigrationStep] = useState<string | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationSummary | null>(null);
  const [migrationError, setMigrationError] = useState<string | null>(null);

  const notify = (msg: string) => {
    if (onNotification) onNotification(msg);
  };

  const loadLiveTableCounts = async () => {
    if (!isSupabaseConfigured) return;
    setIsLoadingCounts(true);
    try {
      const counts = await fetchCloudTableCounts();
      setTableCounts(counts);
    } catch {
      // ignore
    } finally {
      setIsLoadingCounts(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await checkDatabaseSchemaStatus();
    setTestResult(result);
    setIsTesting(false);
  };

  // Run initial diagnostic on mount if credentials are configured
  React.useEffect(() => {
    if (isSupabaseConfigured) {
      checkDatabaseSchemaStatus().then((res) => {
        setTestResult(res);
      });
      loadLiveTableCounts();
    }
  }, []);

  const handleCopySql = () => {
    try {
      navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
      setCopiedSql(true);
      notify('PostgreSQL migration script copied to clipboard!');
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {
      notify('Unable to access clipboard. Please copy schema manually.');
    }
  };

  const handleCopyEnv = () => {
    const envSnippet = `VITE_SUPABASE_URL="https://your-project.supabase.co"\nVITE_SUPABASE_ANON_KEY="your-anon-public-key"`;
    try {
      navigator.clipboard.writeText(envSnippet);
      setCopiedEnv(true);
      notify('Environment variables template copied!');
      setTimeout(() => setCopiedEnv(false), 2500);
    } catch {
      notify('Unable to access clipboard.');
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMsg(null);

    if (authMode === 'signin') {
      const res = await signIn(authEmail, authPassword);
      if (!res.success) {
        setAuthError(res.error || 'Failed to sign in');
      } else {
        setAuthSuccessMsg('Signed in successfully!');
        notify('Signed in as restaurant owner');
      }
    } else {
      const res = await signUp(authEmail, authPassword);
      if (!res.success) {
        setAuthError(res.error || 'Failed to sign up');
      } else {
        setAuthSuccessMsg(res.message || 'Account created successfully!');
        notify('Account created successfully');
      }
    }
  };

  const handleOpenMigrationConfirm = () => {
    if (!user) {
      setMigrationError('You must be signed in with Supabase Auth to assign ownership of this restaurant.');
      return;
    }
    setMigrationError(null);
    setShowConfirmModal(true);
  };

  const handleExecuteMigration = async () => {
    if (!user) {
      setMigrationError('You must be signed in with Supabase Auth to assign ownership of this restaurant.');
      setShowConfirmModal(false);
      return;
    }

    setShowConfirmModal(false);
    setIsMigrating(true);
    setMigrationStep('Starting cloud migration...');
    setMigrationError(null);
    setMigrationResult(null);

    try {
      const res = await migrateLocalDataToCloud(
        user,
        restaurant,
        dishes,
        categories,
        (step, details) => {
          setMigrationStep(`${step}${details ? `: ${details}` : ''}`);
        }
      );

      setIsMigrating(false);
      setMigrationStep(null);

      if (!res.success) {
        setMigrationError(res.error || 'Migration failed. Ensure the SQL schema has been executed in your Supabase SQL editor.');
      } else if (res.summary) {
        setMigrationResult(res.summary);
        notify(`Migrated ${res.summary.dishesCount} dishes to Supabase cloud!`);
        // Refresh live table counts to show verified database rows
        loadLiveTableCounts();
      }
    } catch (err: unknown) {
      setIsMigrating(false);
      setMigrationStep(null);
      const msg = err instanceof Error ? err.message : String(err);
      setMigrationError(`Unexpected migration error: ${msg}`);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* 1. Header Banner & Current Mode Status */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#0f1b33] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-400/20 border border-teal-400/40 text-teal-300 flex items-center justify-center shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Multi-Restaurant SaaS & Supabase
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    isSupabaseConfigured
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                      : 'bg-teal-950 text-teal-300 border-teal-800'
                  }`}
                >
                  {isSupabaseConfigured ? '● Cloud Connected' : '● Local Prototype Active'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isSupabaseConfigured
                  ? 'Connected to your Supabase project. Ready for authentication and shared multi-tenant cloud storage.'
                  : 'Running safely in offline browser storage. Complete all features without any required external credentials.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Test connection to Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
            </button>
          </div>
        </div>

        {/* Live Diagnostic Message */}
        {testResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs space-y-2.5 animate-in fade-in duration-200 ${
              testResult.connected
                ? testResult.tablesExist
                  ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
                  : 'bg-amber-950/30 border-amber-800/80 text-amber-200'
                : 'bg-rose-950/30 border-rose-800/80 text-rose-200'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {testResult.connected ? (
                testResult.tablesExist ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">
                    {testResult.connected
                      ? testResult.tablesExist
                        ? 'Supabase Connected & Fully Initialized'
                        : 'Supabase API Connected (Tables Pending)'
                      : 'Connection Failed'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      testResult.connected
                        ? testResult.tablesExist
                          ? 'bg-emerald-900/60 text-emerald-300'
                          : 'bg-amber-900/60 text-amber-300'
                        : 'bg-rose-900/60 text-rose-300'
                    }`}
                  >
                    {testResult.connected
                      ? testResult.tablesExist
                        ? 'Ready for Cloud'
                        : 'Action Required'
                      : 'Offline'}
                  </span>
                </div>
                <p className="text-[11px] mt-1 text-slate-300 break-words leading-relaxed">
                  {testResult.message}
                </p>
              </div>
            </div>

            {/* Table-by-Table Schema Inspection */}
            {testResult.connected && Object.keys(testResult.tableDetails).length > 0 && (
              <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                  <span>Database Tables Status:</span>
                  {!testResult.tablesExist && (
                    <button
                      type="button"
                      onClick={handleCopySql}
                      className="text-[11px] text-teal-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy Migration SQL</span>
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(testResult.tableDetails).map(([tableName, exists]) => (
                    <span
                      key={tableName}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 border ${
                        exists
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                          : 'bg-amber-950/60 text-amber-300 border-amber-800/80'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${exists ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      <span>{tableName}</span>
                      <span className="opacity-70 font-sans text-[9px]">{exists ? '✓' : 'missing'}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Privacy & Prototype Integrity Guarantees */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
            <span>Non-Destructive Local Fallback</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 flex items-center gap-2">
            <Lock className="w-4 h-4 text-teal-400 shrink-0" />
            <span>Strict Row-Level Security</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-400 shrink-0" />
            <span>Multi-Tenant Architecture</span>
          </div>
        </div>
      </div>

      {/* 2. Step-by-Step Setup Guide & SQL Migration Schema */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#0f1b33] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-400" />
              <span>Supabase Cloud Integration Guide</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Follow these three steps to connect your multi-restaurant production backend.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySql}
              className="px-3 py-1.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              title="Copy complete SQL migration to clipboard"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Schema'}</span>
            </button>
          </div>
        </div>

        {/* 3 Step Cards */}
        <div className="space-y-3">
          {/* Step 1 */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-white font-bold">
              <span className="w-5 h-5 rounded-full bg-teal-400 text-slate-950 flex items-center justify-center text-[11px] font-black shrink-0">
                1
              </span>
              <span>Create a Supabase Project</span>
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="text-teal-400 hover:underline flex items-center gap-1 text-[11px] ml-auto"
              >
                <span>supabase.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-slate-400 pl-7 leading-relaxed">
              Create a free project in Supabase. Navigate to <strong>Project Settings &rarr; API</strong> to find your Project URL and Anon/Public Key.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-white font-bold">
              <span className="w-5 h-5 rounded-full bg-teal-400 text-slate-950 flex items-center justify-center text-[11px] font-black shrink-0">
                2
              </span>
              <span>Run the SQL Migration in Supabase SQL Editor</span>
            </div>
            <p className="text-slate-400 pl-7 leading-relaxed">
              Open the <strong>SQL Editor</strong> in your Supabase dashboard, click &ldquo;New query&rdquo;, paste the schema using the <strong>Copy SQL Schema</strong> button above, and click <strong>Run</strong>.
            </p>
            <div className="pl-7 pt-1 text-[11px] text-slate-400 flex flex-wrap gap-2">
              <span className="bg-slate-800/80 px-2 py-0.5 rounded font-mono">restaurants</span>
              <span className="bg-slate-800/80 px-2 py-0.5 rounded font-mono">restaurant_members</span>
              <span className="bg-slate-800/80 px-2 py-0.5 rounded font-mono">categories</span>
              <span className="bg-slate-800/80 px-2 py-0.5 rounded font-mono">dishes</span>
              <span className="bg-slate-800/80 px-2 py-0.5 rounded font-mono">menu_analytics_events</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-white font-bold">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-400 text-slate-950 flex items-center justify-center text-[11px] font-black shrink-0">
                  3
                </span>
                <span>Configure Environment Variables</span>
              </div>
              <button
                type="button"
                onClick={handleCopyEnv}
                className="text-xs text-teal-400 hover:underline flex items-center gap-1 font-semibold"
              >
                {copiedEnv ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedEnv ? 'Copied' : 'Copy Keys'}</span>
              </button>
            </div>
            <p className="text-slate-400 pl-7 leading-relaxed">
              Set these variables in your deployment or <code className="text-teal-300 font-mono">.env</code> file:
            </p>
            <div className="pl-7 pt-1">
              <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-teal-300 overflow-x-auto select-all">
{`VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Authentication & Account Management */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#0f1b33] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-teal-400" />
              <span>Restaurant Owner Authentication</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Secure email/password login powered by Supabase Auth with Row Level Security.
            </p>
          </div>

          {user && (
            <button
              type="button"
              onClick={() => signOut()}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-800 text-xs font-semibold text-slate-300 hover:text-rose-300 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>

        {/* Case A: Already Signed In */}
        {user ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-white block truncate">{user.email}</span>
                  <span className="text-[10px] text-emerald-300 font-mono block">
                    Owner ID: {user.id.slice(0, 12)}...
                  </span>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-700 shrink-0">
                Authenticated Owner
              </span>
            </div>

            {/* Migration Control for Signed In User */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-teal-400" />
                  <h5 className="font-bold text-xs text-white">Cloud Migration & Multi-Tenant Sync</h5>
                </div>
                <span className="text-[10px] text-teal-300 font-mono bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800">
                  Target: /{restaurant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                </span>
              </div>

              {/* Migration Preview Card */}
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs space-y-2">
                <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                  <span>Data Migration Preview:</span>
                  <span className="text-teal-400 font-bold">Ready to sync</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Restaurant</span>
                    <span className="font-bold text-white truncate block">{restaurant.name}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Menu Items</span>
                    <span className="font-bold text-white block">{dishes.length} Dishes</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Categories</span>
                    <span className="font-bold text-white block">{categories.length} Sections</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Local Storage</span>
                    <span className="font-bold text-emerald-400 block">Preserved 100%</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                  Safe idempotent sync: Updating or re-running migration updates existing records instead of creating duplicates.
                </p>
              </div>

              {/* Live Cloud Table Row Counts Diagnostic */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-teal-400" />
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                      Live Cloud Database Row Counts
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      (Project: {configInfo.url ? configInfo.url.replace('https://', '').split('.')[0] : 'not configured'})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={loadLiveTableCounts}
                    disabled={isLoadingCounts}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] text-teal-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingCounts ? 'animate-spin' : ''}`} />
                    <span>{isLoadingCounts ? 'Counting...' : 'Refresh Row Counts'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/90">
                    <span className="text-[10px] text-slate-400 block font-mono">restaurants</span>
                    <span className="text-sm font-bold text-white block mt-0.5">
                      {tableCounts?.restaurants !== null && tableCounts?.restaurants !== undefined
                        ? tableCounts.restaurants
                        : '—'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/90">
                    <span className="text-[10px] text-slate-400 block font-mono">members</span>
                    <span className="text-sm font-bold text-white block mt-0.5">
                      {tableCounts?.restaurant_members !== null && tableCounts?.restaurant_members !== undefined
                        ? tableCounts.restaurant_members
                        : '—'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/90">
                    <span className="text-[10px] text-slate-400 block font-mono">categories</span>
                    <span className="text-sm font-bold text-white block mt-0.5">
                      {tableCounts?.categories !== null && tableCounts?.categories !== undefined
                        ? tableCounts.categories
                        : '—'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/90">
                    <span className="text-[10px] text-slate-400 block font-mono">dishes</span>
                    <span className="text-sm font-bold text-white block mt-0.5">
                      {tableCounts?.dishes !== null && tableCounts?.dishes !== undefined
                        ? tableCounts.dishes
                        : '—'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/90">
                    <span className="text-[10px] text-slate-400 block font-mono">analytics</span>
                    <span className="text-sm font-bold text-white block mt-0.5">
                      {tableCounts?.menu_analytics_events !== null && tableCounts?.menu_analytics_events !== undefined
                        ? tableCounts.menu_analytics_events
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Migration Action Button & Progress Indicator */}
              <div className="pt-1 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleOpenMigrationConfirm}
                  disabled={isMigrating}
                  className="px-4 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-teal-500/20 disabled:opacity-50"
                >
                  <UploadCloud className={`w-3.5 h-3.5 ${isMigrating ? 'animate-bounce' : ''}`} />
                  <span>{isMigrating ? 'Migrating Data to Cloud...' : `Confirm & Migrate ${dishes.length} Dishes to Supabase`}</span>
                </button>
                <span className="text-[11px] text-slate-500">
                  Browser localStorage remains untouched as offline backup.
                </span>
              </div>

              {/* In-App Confirmation Modal (Replaces blocked window.confirm) */}
              {showConfirmModal && (
                <div className="p-4 rounded-xl bg-slate-950 border-2 border-teal-500/50 space-y-3 animate-in zoom-in-95 duration-200">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-400/20 border border-teal-400/40 text-teal-300 flex items-center justify-center shrink-0">
                      <UploadCloud className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-white">
                        Confirm Menu Migration to Supabase
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Are you sure you want to copy all local menu data for <strong className="text-white">{restaurant.name}</strong> to your Supabase PostgreSQL database?
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target Project:</span>
                      <span className="font-mono text-teal-300">{configInfo.url || 'Configured project'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Owner Account:</span>
                      <span className="font-bold text-white">{user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Items to Sync:</span>
                      <span className="text-white font-semibold">{dishes.length} Dishes, {categories.length} Categories</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Local Browser Storage:</span>
                      <span className="text-emerald-400 font-bold">100% Preserved as Backup</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowConfirmModal(false)}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteMigration}
                      className="px-4 py-1.5 rounded-lg bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Proceed with Cloud Migration</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Active Migration Step Tracker */}
              {isMigrating && migrationStep && (
                <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-500/60 text-xs text-teal-200 flex items-center gap-2.5 animate-in fade-in duration-200">
                  <RefreshCw className="w-4 h-4 text-teal-400 animate-spin shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-white block">Migration in progress...</span>
                    <span className="text-[11px] text-teal-300 font-mono block mt-0.5">{migrationStep}</span>
                  </div>
                </div>
              )}

              {migrationResult && (
                <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-600/80 text-xs text-teal-200 space-y-1.5 animate-in fade-in duration-200">
                  <span className="font-bold flex items-center gap-1.5 text-white">
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    Cloud Migration & Sync Verified!
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Successfully verified in Supabase: <strong className="text-white">{migrationResult.dishesCount} dishes</strong> and <strong className="text-white">{migrationResult.categoriesCount} categories</strong> under restaurant slug <code className="text-teal-300 font-mono">/{migrationResult.slug}</code> with <strong className="text-white">{migrationResult.analyticsCount} engagement events</strong>.
                  </p>
                </div>
              )}

              {migrationError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-xs text-rose-200 flex items-start gap-2 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-rose-300 block">Migration Failed</span>
                    <p className="text-[11px] text-rose-200 break-words mt-0.5 leading-relaxed">{migrationError}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : isSupabaseConfigured ? (
          /* Case B: Configured but Not Signed In */
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  authMode === 'signin'
                    ? 'bg-teal-400 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In to Existing Account
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  authMode === 'signup'
                    ? 'bg-teal-400 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Restaurant Owner Account
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3 max-w-md">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Owner Email Address
                </label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="owner@greenleafcafe.com"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              {authError && (
                <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccessMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{authSuccessMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2 px-4 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {authLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : authMode === 'signin' ? (
                  <LogIn className="w-3.5 h-3.5" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                <span>{authMode === 'signin' ? 'Sign In as Owner' : 'Create Owner Account'}</span>
              </button>
            </form>
          </div>
        ) : (
          /* Case C: Unconfigured */
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-teal-300 font-semibold">
              <Info className="w-4 h-4 shrink-0" />
              <span>Authentication is Ready to Activate</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              Supabase Auth logic is fully implemented and tested. Once you add your <code className="text-teal-300 font-mono">VITE_SUPABASE_URL</code> and <code className="text-teal-300 font-mono">VITE_SUPABASE_ANON_KEY</code> variables, you can immediately create restaurant owner accounts, log in, and control Row Level Security policies.
            </p>
          </div>
        )}
      </div>

      {/* 4. Row Level Security & Access Control Summary */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#0f1b33] border border-slate-800 space-y-3">
        <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-teal-400" />
          <span>Tenant Isolation & Privacy Architecture</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="font-bold text-teal-300 block">Public Guest Permissions</span>
            <ul className="text-slate-400 space-y-1 text-[11px] list-disc list-inside">
              <li>Can read only published menus and active dishes</li>
              <li>Cannot see unpublished draft dishes or other restaurants</li>
              <li>Can record anonymous engagement events (views, searches)</li>
              <li>CANNOT view analytics results or query guest metrics</li>
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-300 block">Authenticated Owner Permissions</span>
            <ul className="text-slate-400 space-y-1 text-[11px] list-disc list-inside">
              <li>Full access to add, edit, and delete their own dishes</li>
              <li>Exclusive private access to their restaurant&apos;s analytics</li>
              <li>Isolated from any other restaurant on the platform</li>
              <li>Enforced server-side at PostgreSQL level via RLS</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
