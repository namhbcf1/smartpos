// Enhanced AuthContext - Following rules.md standards
// NO MOCK DATA - Real authentication only

import React, { createContext, useState, useEffect, ReactNode } from 'react';
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
  
  // Initialize authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      console.log('🔐 AuthContext: Initializing authentication...');

      const storedToken = sessionStorage.getItem('auth_token');
      const storedUser = sessionStorage.getItem('user');

      if (storedToken && storedUser) {
        console.log('🔐 AuthContext: Found stored session, validating...');
        
        try {
          const isValid = await checkAuthSilent();
          if (isValid) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setIsAuthenticated(true);
            console.log('✅ AuthContext: Session validated successfully');

            // Load user permissions
            try {
              await permissionService.loadUserPermissions(userData.id);
              console.log('✅ AuthContext: User permissions loaded from stored session');
            } catch (error) {
              console.error('❌ AuthContext: Failed to load permissions from stored session:', error);
            }
          } else {
            console.log('❌ AuthContext: Session invalid, clearing...');
            clearStoredAuth();
          }
        } catch (error) {
          console.error('❌ AuthContext: Failed to validate session:', error);
          clearStoredAuth();
        }
      } else {
        console.log('🔐 AuthContext: No stored session found');
        setUser(null);
        setIsAuthenticated(false);
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const clearStoredAuth = () => {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);

    // Clear permissions
    permissionService.clearPermissions();
  };

  // Login function
  const login = async (username: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('🔐 AuthContext: Starting login...');

      const response = await authAPI.login({ username, password });

      if (response.success && response.data) {
        const { user: userData, token } = response.data;

        console.log('✅ AuthContext: Login successful');
        
        setUser(userData);
        setIsAuthenticated(true);

        // Store in sessionStorage for security
        sessionStorage.setItem('user', JSON.stringify(userData));
        sessionStorage.setItem('auth_token', token);

        // Set token in API service
        const { setAuthToken } = await import('../services/api');
        setAuthToken(token);

        // Load user permissions
        try {
          await permissionService.loadUserPermissions(userData.id);
          console.log('✅ AuthContext: User permissions loaded');
        } catch (error) {
          console.error('❌ AuthContext: Failed to load permissions:', error);
        }

      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('❌ AuthContext: Login failed:', error);
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
      console.log('🔐 AuthContext: Logging out...');

      await authAPI.logout();
      console.log('✅ AuthContext: Logout successful');
    } catch (error) {
      console.error('❌ AuthContext: Logout API failed:', error);
    } finally {
      clearStoredAuth();
      setIsLoading(false);
    }
  };
  
  // Check authentication status
  const checkAuth = async (): Promise<boolean> => {
    try {
      console.log('🔐 AuthContext: Checking authentication...');
      
      const response = await authAPI.me();
      
      if (response.success && response.data) {
        setUser(response.data);
        setIsAuthenticated(true);
        sessionStorage.setItem('user', JSON.stringify(response.data));
        console.log('✅ AuthContext: Authentication valid');

        // Load user permissions
        try {
          await permissionService.loadUserPermissions(response.data.id);
          console.log('✅ AuthContext: User permissions loaded from checkAuth');
        } catch (error) {
          console.error('❌ AuthContext: Failed to load permissions from checkAuth:', error);
        }
        return true;
      } else {
        clearStoredAuth();
        console.log('❌ AuthContext: Authentication invalid');
        return false;
      }
    } catch (error) {
      console.error('❌ AuthContext: Auth check failed:', error);
      clearStoredAuth();
      return false;
    }
  };

  // Silent authentication check (no error logging)
  const checkAuthSilent = async (): Promise<boolean> => {
    try {
      const response = await authAPI.me();
      
      if (response.success && response.data) {
        setUser(response.data);
        setIsAuthenticated(true);
        sessionStorage.setItem('user', JSON.stringify(response.data));
        return true;
      } else {
        clearStoredAuth();
        return false;
      }
    } catch (error) {
      clearStoredAuth();
      return false;
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