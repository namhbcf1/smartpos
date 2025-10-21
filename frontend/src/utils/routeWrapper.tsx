import React from 'react';
import LazyWrapper from '../components/LazyWrapper';

// Higher-order component to wrap routes with lazy loading
export const withLazyLoading = (Component: React.ComponentType<any>) => {
  return (props: any) => (
    <LazyWrapper>
      <Component {...props} />
    </LazyWrapper>
  );
};

// Route wrapper for protected routes
export const ProtectedRouteWrapper = ({ children }: { children: React.ReactNode }) => {
  return <LazyWrapper>{children}</LazyWrapper>;
};

// Route wrapper for public routes
export const PublicRouteWrapper = ({ children }: { children: React.ReactNode }) => {
  return <LazyWrapper>{children}</LazyWrapper>;
};
