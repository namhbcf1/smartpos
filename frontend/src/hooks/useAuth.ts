import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  const state = context;
  const user = state.user as any;
  const permissions: string[] = user?.permissions || user?.roles?.flatMap((r: any) => r.permissions) || [];
  const hasPermission = (perm: string) => !!permissions?.includes(perm);
  return { ...state, user, permissions, hasPermission } as any;
} 