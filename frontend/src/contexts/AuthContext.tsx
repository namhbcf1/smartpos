// Enhanced AuthContext - Following rules.md standards
// NO MOCK DATA - Real authentication only
// Production-only, online-only operation

import React, { createContext, useState, useEffect, useRef, ReactNode } from 'react';
import { comprehensiveAPI } from '../services/business/comprehensiveApi';
import { authAPI, setAuthToken } from '../services/api';
import { User } from '../types/api';
import { permissionService } from '../services/permission/permissionService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  checkAuthSilent: () => Promise<boolean>;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Create context
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  checkAuth: async () => false,
  checkAuthSilent: async () => false
});

// Auth provider component
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Use refs to prevent multiple auth checks and track component state
  const isMountedRef = useRef(true);
  const hasInitializedRef = useRef(false);
  const authCheckInProgressRef = useRef(false);
  const authCheckPromiseRef = useRef<Promise<boolean> | null>(null);

  // AUTO LOGIN SOLUTION: Check authentication on app load
  useEffect(() => {
    console.log('🔧 AUTO LOGIN: Checking authentication on app load');

    const initializeAuth = async () => {
      if (authCheckInProgressRef.current || hasInitializedRef.current) {
        console.log('Auth already initialized or in progress, skipping...');
        setIsLoading(false);
        return;
      }

      authCheckInProgressRef.current = true;
      hasInitializedRef.current = true;

      try {
        // Check for existing token in sessionStorage
        const existingToken = sessionStorage.getItem('auth_token');
        console.log('Existing token found:', !!existingToken);

        if (existingToken && existingToken.split('.').length === 3) {
          console.log('Valid JWT format found, setting auth...');
          setAuthToken(existingToken);

          // Prefer session user, otherwise fetch from backend
          const userStr = sessionStorage.getItem('user');
          if (userStr) {
            try {
              const userData = JSON.parse(userStr);
              setUser(userData);
              setIsAuthenticated(true);
              console.log('✅ Auto login from session successful');
              return;
            } catch (error) {
              console.warn('Failed to parse user data:', error);
            }
          }

          // Fallback: verify token and get user from backend
          try {
            const me = await comprehensiveAPI.auth.me();
            if (me.success && me.data) {
              setUser(me.data as any);
              setIsAuthenticated(true);
              sessionStorage.setItem('user', JSON.stringify(me.data));
              console.log('✅ Auto login via /auth/me successful');
              return;
            }
          } catch (err) {
            console.warn('Auto login fallback /auth/me failed:', err);
          }
        }

        console.log('No valid session found, user needs to login');
        setIsAuthenticated(false);
        setUser(null);

      } catch (error) {
        console.error('Auto login error:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        console.log('Setting isLoading to false');
        setIsLoading(false);
        authCheckInProgressRef.current = false;
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(initializeAuth, 100);

    // Cleanup function to prevent memory leaks
    return () => {
      clearTimeout(timeoutId);
      console.log('🧹 AuthProvider cleanup');
      isMountedRef.current = false;
      authCheckInProgressRef.current = false;
    };
  }, []); // Empty dependency array ensures this runs only once

  const clearStoredAuth = () => {
    try {
      document.cookie = 'auth_token=; Path=/; Max-Age=0; Secure; SameSite=None';
    } catch (_) {}
    try {
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user');
    } catch (_) {}
    setUser(null);
    setIsAuthenticated(false);
    permissionService.clearPermissions();
  };

  // Login function (real D1 auth)
  const login = async (username: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('🔐 Attempting login with real backend...');

      const res = await authAPI.login({ username, password } as any);
      if (!res.success || !res.data?.token) {
        throw new Error(res.message || 'Đăng nhập thất bại');
      }

      const token = res.data.token;
      const backendUser = res.data.user as any;

      // Persist token and user data for this tab session
      try {
        sessionStorage.setItem('auth_token', token);
        if (backendUser) {
          sessionStorage.setItem('user', JSON.stringify(backendUser));
        }
      } catch (_) {}
      setAuthToken(token);

      // Trust backend user payload; fallback to fetching /auth/me later if needed
      setUser(backendUser || null);
      setIsAuthenticated(true);

      console.log('✅ Login successful, auth state updated:', {
        user: backendUser,
        isAuthenticated: true
      });

      // Load user permissions (best-effort)
      try {
        const uid = (backendUser?.id ?? backendUser?.userId ?? '1').toString();
        await permissionService.loadUserPermissions(uid);
      } catch (error) {
        console.error('Failed to load user permissions:', error);
      }
    } catch (error) {
      console.error('Login failed:', error);
      clearStoredAuth();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);

      await comprehensiveAPI.auth.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      clearStoredAuth();
      setIsLoading(false);
    }
  };
  
  // Check authentication status
  const checkAuth = async (): Promise<boolean> => {
    try {
      const response = await comprehensiveAPI.auth.me();
      
      if (response.success && response.data) {
        setUser(response.data);
        setIsAuthenticated(true);
        // No localStorage/sessionStorage - security compliance

        // Load user permissions
        try {
          await permissionService.loadUserPermissions(response.data.id);
        } catch (error) {
          console.error('Failed to load user permissions:', error);
        }
        return true;
      } else {
        clearStoredAuth();
        return false;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      clearStoredAuth();
      return false;
    }
  };

  // Silent authentication check - single use only, no loops
  const checkAuthSilent = async (): Promise<boolean> => {
    // De-duplicate concurrent checks
    if (authCheckPromiseRef.current) {
      console.log('🔄 Auth check already in progress (promise). Waiting...');
      return authCheckPromiseRef.current;
    }

    authCheckPromiseRef.current = (async () => {
      try {
      console.log('🔍 Manual silent auth check...');
      authCheckInProgressRef.current = true;

      // Prefer sessionStorage token; fallback to cookie
      let token = '' as string | null;
      try {
        token = sessionStorage.getItem('auth_token');
      } catch (_) {}
      if (!token) {
        token = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth_token='))
          ?.split('=')[1] || null;
      }

      if (!isMountedRef.current) return false;

      // Token must be a JWT (three dot-separated parts)
      if (token && token.split('.').length === 3) {
        try {
          setAuthToken(token);
        } catch (_) {}

        // Verify and fetch user from backend
        const me = await comprehensiveAPI.auth.me();
        if (me.success && me.data) {
          setUser(me.data as any);
          setIsAuthenticated(true);
          return true;
        }
      } else {
        console.log('❌ Silent auth check failed - no valid session token found');
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }
    } catch (error: any) {
      if (!isMountedRef.current) return false;

      console.log('❌ Silent auth check error:', error);
      setUser(null);
      setIsAuthenticated(false);
      return false;
    } finally {
      authCheckInProgressRef.current = false;
    }
    })();

    const result = await authCheckPromiseRef.current;
    authCheckPromiseRef.current = null;
    return result;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth,
    checkAuthSilent
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 
