/**
 * Performance optimization utilities
 */

// Debounce function for search inputs
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function for scroll events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Memoization for expensive calculations
export const memoize = <T extends (...args: any[]) => any>(
  func: T
): T => {
  const cache = new Map();
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

// Lazy loading helper
export const lazyLoad = (importFn: () => Promise<any>) => {
  return React.lazy(importFn);
};

// Preload critical resources
export const preloadResource = (href: string, as: string) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
};

// Image lazy loading
export const lazyLoadImage = (src: string, alt: string) => {
  const img = new Image();
  img.loading = 'lazy';
  img.src = src;
  img.alt = alt;
  return img;
};

// Virtual scrolling helper
export const getVisibleItems = (
  items: any[],
  scrollTop: number,
  itemHeight: number,
  containerHeight: number
) => {
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  return {
    startIndex,
    endIndex,
    visibleItems: items.slice(startIndex, endIndex)
  };
};

// Performance monitoring
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${name} took ${end - start} milliseconds`);
};

// Bundle size optimization
export const optimizeImports = {
  // Only import what you need from Material-UI
  mui: {
    components: ['Box', 'Typography', 'Button', 'Card', 'CardContent'],
    icons: ['Search', 'Add', 'Refresh', 'Edit', 'Delete']
  },
  
  // Lazy load heavy components
  lazy: {
    charts: () => import('recharts'),
    datePicker: () => import('@mui/x-date-pickers'),
    dataGrid: () => import('@mui/x-data-grid')
  }
};
