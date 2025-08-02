import { useState, useCallback, useRef } from 'react';
import { apiRateLimiter, debounce, throttle } from '@/lib/utils/rateLimit';

interface UseApiCallOptions {
  rateLimitKey?: string;
  debounceMs?: number;
  throttleMs?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

interface UseApiCallReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export function useApiCall<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiCallOptions = {}
): UseApiCallReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    rateLimitKey = 'default',
    debounceMs,
    throttleMs,
    retryAttempts = 3,
    retryDelay = 1000
  } = options;

  const abortControllerRef = useRef<AbortController | null>(null);

  const executeWithRateLimit = useCallback(async (...args: any[]): Promise<T | null> => {
    // Check rate limit
    if (!apiRateLimiter.canMakeRequest(rateLimitKey)) {
      throw new Error('Rate limit exceeded. Please wait before making another request.');
    }

    // Cancel previous request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        setLoading(true);
        setError(null);

        const result = await apiFunction(...args);
        
        if (abortControllerRef.current?.signal.aborted) {
          return null;
        }

        setData(result);
        return result;
      } catch (err: any) {
        lastError = err;
        
        // Don't retry if it's a rate limit error or user cancelled
        if (err.message?.includes('Rate limit') || err.name === 'AbortError') {
          setError(err.message);
          break;
        }

        // Wait before retry (except for last attempt)
        if (attempt < retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setLoading(false);
        }
      }
    }

    if (lastError) {
      setError(lastError.message);
    }
    
    return null;
  }, [apiFunction, rateLimitKey, retryAttempts, retryDelay]);

  // Apply debounce or throttle if specified
  const execute = useCallback((...args: any[]) => {
    if (debounceMs) {
      const debouncedExecute = debounce(executeWithRateLimit, debounceMs);
      return debouncedExecute(...args);
    }
    
    if (throttleMs) {
      const throttledExecute = throttle(executeWithRateLimit, throttleMs);
      return throttledExecute(...args);
    }
    
    return executeWithRateLimit(...args);
  }, [executeWithRateLimit, debounceMs, throttleMs]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset
  };
} 