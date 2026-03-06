import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Check if an error is an AbortError (request cancellation)
 * Used to gracefully handle navigation-related request cancellations
 * without logging them as actual errors.
 */
export const isAbortError = (error: unknown): boolean => {
  if (!error) return false;

  const err = error as { name?: string; message?: string };

  // Check error name
  if (err.name === 'AbortError') return true;

  // Check error message for various AbortError patterns
  const message = err.message || '';
  if (
    message.includes('AbortError') ||
    message.includes('signal is aborted') ||
    message.includes('cancelled') ||
    message.includes('canceled')
  ) return true;

  return false;
};
