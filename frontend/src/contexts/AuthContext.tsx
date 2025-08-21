// Enhanced AuthContext - Following rules.md standards
// NO MOCK DATA - Real authentication only
// Production-only, online-only operation

import React, { createContext, useState, useEffect, useRef, ReactNode } from 'react';
import { authAPI } from '../services/api';
import { User } from '../types/api';
import { permissionService } from '../services/permissionService';

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

  // FINAL SOLUTION: NO AUTO AUTH CHECK - MANUAL ONLY
  useEffect(() => {
    console.log('🔧 FINAL AUTH SOLUTION: Manual authentication only');

    // Immediately set to not loading and not authenticated
    // No automatic API calls that can cause infinite loops
    setIsLoading(false);
    setIsAuthenticated(false);
    setUser(null);

    hasInitializedRef.current = true;

    // Cleanup function to prevent memory leaks
    return () => {
      console.log('🧹 AuthProvider cleanup');
      isMountedRef.current = false;
      authCheckInProgressRef.current = false;
    };
  }, []); // Empty dependency array ensures this runs only once

  const clearStoredAuth = () => {
    // Clear auth cookie (no localStorage/sessionStorage - security compliance)
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setUser(null);
    setIsAuthenticated(false);

    // Clear permissions
    permissionService.clearPermissions();
  };

  // Login function
  const login = async (username: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);

      const response = await authAPI.login({ username, password });

      if (response.success && response.data) {
        const { user: userData, token } = response.data;
        
        setUser(userData);
        setIsAuthenticated(true);

        // Token stored in secure HttpOnly cookie by backend
        // No localStorage/sessionStorage usage for security compliance

        // Set token in API service (will read from cookie)
        const { setAuthToken } = await import('../services/api');
        setAuthToken(token);

        // Load user permissions
        try {
          await permissionService.loadUserPermissions(userData.id);
        } catch (error) {
          console.error('Failed to load user permissions:', error);
        }

      } else {
        throw new Error(response.message || response.error || 'Login failed');
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

      await authAPI.logout();
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
      const response = await authAPI.me();
      
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
    // Prevent multiple simultaneous silent checks
    if (authCheckInProgressRef.current) {
      console.log('🔄 Auth check already in progress, returning current state');
      return isAuthenticated;
    }

    try {
      console.log('🔍 Manual silent auth check...');
      authCheckInProgressRef.current = true;

      const response = await authAPI.me();

      if (!isMountedRef.current) return false;

      if (response.success && response.data) {
        console.log('✅ Silent auth check successful');
        setUser(response.data);
        setIsAuthenticated(true);
        return true;
      } else {
        console.log('❌ Silent auth check failed - no valid session');
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }
    } catch (error: any) {
      if (!isMountedRef.current) return false;

      // Handle 401 gracefully
      if (error?.response?.status === 401 || error?.message?.includes('NO_TOKEN')) {
        console.log('❌ Silent auth check: No valid authentication');
      } else {
        console.log('❌ Silent auth check error:', error);
      }

      setUser(null);
      setIsAuthenticated(false);
      return false;
    } finally {
      authCheckInProgressRef.current = false;
    }
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