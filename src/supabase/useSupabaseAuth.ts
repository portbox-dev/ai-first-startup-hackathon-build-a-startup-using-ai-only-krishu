import { useState, useEffect, useCallback } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './client';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  error: string | null;
}

export function useSupabaseAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: isSupabaseConfigured,
    isConfigured: isSupabaseConfigured,
    error: null,
  });

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      setState((prev) => ({ ...prev, isLoading: false, isConfigured: false }));
      return;
    }

    let isMounted = true;

    // Fetch initial session
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (!isMounted) return;
        if (error) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: error.message,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            session,
            user: session?.user ?? null,
            isLoading: false,
            error: null,
          }));
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : String(err),
        }));
      });

    // Listen to live auth changes (e.g. sign-in, sign-out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setState((prev) => ({
        ...prev,
        session,
        user: session?.user ?? null,
        isLoading: false,
        error: null,
      }));
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      if (!supabase || !isSupabaseConfigured) {
        return {
          success: false,
          error: 'Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
        };
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        let errorMsg = error.message;
        if (error.message.includes('Email not confirmed')) {
          errorMsg = 'Email confirmation pending. Please check your inbox for the confirmation link, or disable "Confirm email" in Supabase Dashboard -> Authentication -> Email to log in instantly.';
        }
        setState((prev) => ({ ...prev, isLoading: false, error: errorMsg }));
        return { success: false, error: errorMsg };
      }

      setState((prev) => ({
        ...prev,
        user: data.user,
        session: data.session,
        isLoading: false,
        error: null,
      }));
      return { success: true };
    },
    []
  );

  const signUp = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string; message?: string }> => {
      if (!supabase || !isSupabaseConfigured) {
        return {
          success: false,
          error: 'Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
        };
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        let errorMsg = error.message;
        if (error.message.toLowerCase().includes('rate limit')) {
          errorMsg = 'Supabase email send rate limit exceeded on free tier. If you have already signed up, please use "Sign In". To test without email limits, disable "Confirm email" in your Supabase Dashboard -> Authentication -> Email.';
        }
        setState((prev) => ({ ...prev, isLoading: false, error: errorMsg }));
        return { success: false, error: errorMsg };
      }

      setState((prev) => ({
        ...prev,
        user: data.user,
        session: data.session,
        isLoading: false,
        error: null,
      }));

      const message = data.session
        ? 'Account created and signed in successfully!'
        : 'Sign up successful! Please check your email inbox to confirm your account before logging in. (Tip: You can also disable "Confirm email" in Supabase Dashboard -> Authentication -> Email to log in immediately).';

      return { success: true, message };
    },
    []
  );

  const signOut = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!supabase || !isSupabaseConfigured) {
      return { success: true };
    }

    setState((prev) => ({ ...prev, isLoading: true }));
    const { error } = await supabase.auth.signOut();

    if (error) {
      setState((prev) => ({ ...prev, isLoading: false, error: error.message }));
      return { success: false, error: error.message };
    }

    setState((prev) => ({
      ...prev,
      user: null,
      session: null,
      isLoading: false,
      error: null,
    }));
    return { success: true };
  }, []);

  return {
    user: state.user,
    session: state.session,
    isLoading: state.isLoading,
    isConfigured: state.isConfigured,
    error: state.error,
    signIn,
    signUp,
    signOut,
  };
}
