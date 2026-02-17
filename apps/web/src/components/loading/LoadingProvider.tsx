/**
 * LoadingProvider Component
 * Global loading state management with optimistic UI
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingContextType {
  isLoading: boolean;
  loadingMessage: string;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  withLoading: <T>(promise: Promise<T>, message?: string) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

interface LoadingProviderProps {
  children: ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const startLoading = useCallback((message = 'Loading...') => {
    setLoadingMessage(message);
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingMessage('');
  }, []);

  const withLoading = useCallback(async <T,>(
    promise: Promise<T>,
    message = 'Loading...'
  ): Promise<T> => {
    startLoading(message);
    try {
      const result = await promise;
      return result;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return (
    <LoadingContext.Provider
      value={{ isLoading, loadingMessage, startLoading, stopLoading, withLoading }}
    >
      {children}
      <GlobalLoadingOverlay isLoading={isLoading} message={loadingMessage} />
    </LoadingContext.Provider>
  );
}

interface GlobalLoadingOverlayProps {
  isLoading: boolean;
  message: string;
}

function GlobalLoadingOverlay({ isLoading, message }: GlobalLoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-2xl flex flex-col items-center"
          >
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {message}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Skeleton loading component for cards
 */
export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse"
        >
          <div className="h-40 bg-gray-200 dark:bg-gray-700" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <div className="flex justify-between pt-2">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

/**
 * Skeleton loading component for lists
 */
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg animate-pulse"
        >
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
          <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton loading component for tables
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse"
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-b border-gray-100 dark:border-gray-800">
          {Array.from({ length: columns }).map((_, j) => (
            <div
              key={j}
              className="h-4 bg-gray-100 dark:bg-gray-800 rounded flex-1 animate-pulse"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Loading spinner for inline use
 */
export function InlineSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-500`} />
  );
}

/**
 * Button with loading state
 */
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: ReactNode;
}

export function LoadingButton({
  isLoading = false,
  loadingText = 'Loading...',
  children,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <button disabled={isLoading || disabled} {...props}>
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
