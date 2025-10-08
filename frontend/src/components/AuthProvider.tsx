'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';
import { checkAndInstallSunaAgent } from '@/lib/utils/install-suna-agent';
import { clearUserLocalStorage } from '@/lib/utils/clear-local-storage';

type AuthContextType = {
  supabase: SupabaseClient;
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const supabase = createClient();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getInitialSession = async () => {
      console.log('AuthProvider: Getting initial session...');

      // Debug: Check if cookies are accessible
      if (typeof document !== 'undefined') {
        const cookies = document.cookie;
        const hasAuthCookie = cookies.includes('auth-token');
        console.log('AuthProvider: Cookie check:', {
          hasAuthCookie,
          cookieLength: cookies.length,
          cookiePreview: cookies.substring(0, 100)
        });
      }

      try {
        const {
          data: { session: currentSession },
          error
        } = await supabase.auth.getSession();
        console.log('AuthProvider: Session retrieved:', {
          hasSession: !!currentSession,
          userId: currentSession?.user?.id,
          email: currentSession?.user?.email,
          hasError: !!error,
          error: error?.message,
          errorStatus: error?.status,
          errorDetails: error
        });

        if (error) {
          console.error('AuthProvider: getSession error details:', error);
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } catch (error) {
        console.error('AuthProvider: Exception getting session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (isLoading) setIsLoading(false);
        switch (event) {
          case 'SIGNED_IN':
            if (newSession?.user) {
              await checkAndInstallSunaAgent(newSession.user.id, newSession.user.created_at);
            }
            break;
          case 'SIGNED_OUT':
            // Clear local storage when user is signed out (handles all logout scenarios)
            clearUserLocalStorage();
            break;
          case 'TOKEN_REFRESHED':
            break;
          case 'MFA_CHALLENGE_VERIFIED':
            break;
          default:
        }
      },
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]); // Removed isLoading from dependencies to prevent infinite loops

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // Clear local storage after successful sign out
      clearUserLocalStorage();
    } catch (error) {
      console.error('❌ Error signing out:', error);
    }
  };

  const value = {
    supabase,
    session,
    user,
    isLoading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
