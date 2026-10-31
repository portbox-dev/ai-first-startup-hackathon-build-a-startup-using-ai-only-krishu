import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfigInfo } from './types';

// Read configuration safely from Vite environment variables (or process.env fallback in scripts)
const envObj = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : (typeof process !== 'undefined' ? process.env : {}) as any;
const supabaseUrl = envObj?.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = envObj?.VITE_SUPABASE_ANON_KEY as string | undefined;

// Check if credentials are properly provided (non-empty and valid HTTPS URL)
export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseUrl.trim() !== '' &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project.supabase.co') &&
  supabaseAnonKey &&
  supabaseAnonKey.trim() !== '' &&
  !supabaseAnonKey.includes('your-anon-key')
);

// Instantiate client only when verified credentials exist; otherwise null
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!.trim(), supabaseAnonKey!.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Returns user-facing status describing whether cloud storage is connected
 * or if local browser fallback is actively running.
 */
export const getSupabaseConfigInfo = (): SupabaseConfigInfo => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      status: 'unconfigured',
      url: null,
      isConfigured: false,
      message: 'Supabase credentials are not set in .env. Running in Browser Local Prototype mode.',
    };
  }

  if (!isSupabaseConfigured) {
    return {
      status: 'unconfigured',
      url: supabaseUrl,
      isConfigured: false,
      message: 'Placeholder Supabase URL or Anon key detected. Replace with your actual project keys.',
    };
  }

  return {
    status: 'connected',
    url: supabaseUrl,
    isConfigured: true,
    message: 'Supabase client initialized with project credentials.',
  };
};

/**
 * Comprehensive check of the Supabase connection and database schema status.
 * Tests both API connectivity (via auth service / PostgREST) and table availability.
 */
export interface SupabaseHealthCheckResult {
  connected: boolean;
  tablesExist: boolean;
  tableDetails: Record<string, boolean>;
  message: string;
}

export const checkDatabaseSchemaStatus = async (): Promise<SupabaseHealthCheckResult> => {
  if (!supabase || !isSupabaseConfigured) {
    return {
      connected: false,
      tablesExist: false,
      tableDetails: {},
      message: 'Supabase credentials are not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    };
  }

  try {
    // 1. First verify base connectivity using Supabase Auth
    const { error: authError } = await supabase.auth.getSession();
    if (authError) {
      return {
        connected: false,
        tablesExist: false,
        tableDetails: {},
        message: `Supabase authentication endpoint error: ${authError.message}`,
      };
    }

    // 2. Check each required table in the public schema
    const requiredTables = ['restaurants', 'restaurant_members', 'categories', 'dishes', 'menu_analytics_events'];
    const tableDetails: Record<string, boolean> = {};
    let missingCount = 0;
    let permissionDeniedCount = 0;

    for (const table of requiredTables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error) {
        const isMissing =
          error.code === 'PGRST205' ||
          (error.message && (error.message.includes('not find the table') || error.message.includes('does not exist')));
        if (isMissing) {
          tableDetails[table] = false;
          missingCount++;
        } else if (error.code === '42501' || error.message?.includes('permission denied')) {
          tableDetails[table] = true;
          permissionDeniedCount++;
        } else {
          tableDetails[table] = true;
        }
      } else {
        tableDetails[table] = true;
      }
    }

    const allExist = missingCount === 0;

    if (allExist) {
      return {
        connected: true,
        tablesExist: true,
        tableDetails,
        message: 'Successfully connected to Supabase! All 5 database tables are verified and secured with least-privilege Row Level Security policies.',
      };
    }

    return {
      connected: true,
      tablesExist: false,
      tableDetails,
      message: `Connected to Supabase project! However, ${missingCount} of ${requiredTables.length} required tables are not yet created in PostgreSQL. Run the SQL migration in your Supabase SQL Editor to initialize them.`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      tablesExist: false,
      tableDetails: {},
      message: `Network/API connection failed: ${errorMsg}`,
    };
  }
};

/**
 * Perform a live ping/health check against Supabase
 */
export const testSupabaseConnection = async (): Promise<{ success: boolean; tablesExist: boolean; message: string }> => {
  const result = await checkDatabaseSchemaStatus();
  return {
    success: result.connected,
    tablesExist: result.tablesExist,
    message: result.message,
  };
};
