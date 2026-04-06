import { lazy, Suspense, ComponentType } from "react";

/**
 * Lazy load wrapper with loading fallback
 * Optimizes bundle size and initial load time
 */

interface LoadingProps {
  message?: string;
}

const LoadingFallback = ({ message = "Loading..." }: LoadingProps) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

/**
 * Creates a lazy-loaded component with suspense boundary
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc);

  return (props: any) => (
    <Suspense fallback={fallback || <LoadingFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

/**
 * Preload a lazy component
 */
export function preloadComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  importFunc();
}

