import { useCallback, useEffect, useRef, useState } from 'react';

// Types
interface UseFetchState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

interface UseFetchOptions {
    enabled?: boolean;
    refetchOnWindowFocus?: boolean;
    staleTime?: number; // Time in ms after which data is considered stale
    cacheTime?: number; // Time in ms to keep data in cache
    retryCount?: number;
    retryDelay?: number;
}

interface UseFetchParams<T> {
    key: string | string[]; // Unique identifier for the request
    fn: () => Promise<T>; // Function that returns a promise
    deps?: any[]; // Dependencies that should trigger a refetch
    options?: UseFetchOptions;
}

// Global cache to store request results
const globalCache = new Map<string, {
    data: any;
    timestamp: number;
    promise?: Promise<any>;
}>();

// Global loading states to prevent duplicate requests
const globalLoadingStates = new Map<string, Promise<any>>();

// Utility function to create cache key
const createCacheKey = (key: string | string[]): string => {
    return Array.isArray(key) ? key.join(':') : key;
};

// Utility function to check if data is stale
const isStale = (timestamp: number, staleTime: number): boolean => {
    return Date.now() - timestamp > staleTime;
};

/**
 * Enhanced useFetch hook that provides:
 * - Request deduplication
 * - Caching with configurable stale time
 * - Loading states
 * - Error handling
 * - Retry logic
 * - Prevention of unnecessary re-renders
 */
export function useAsyncFetch<T = any>({
    key,
    fn,
    deps = [],
    options = {}
}: UseFetchParams<T>) {
    const {
        enabled = true,
        refetchOnWindowFocus = false,
        staleTime = 5 * 60 * 1000, // 5 minutes default
        cacheTime = 10 * 60 * 1000, // 10 minutes default
        retryCount = 3,
        retryDelay = 1000
    } = options;

    const [state, setState] = useState<UseFetchState<T>>({
        data: null,
        loading: false,
        error: null
    });

    const cacheKey = createCacheKey(key);
    const retryCountRef = useRef(0);
    const mountedRef = useRef(true);
    const lastDepsRef = useRef<any[]>([]);

    // Check if dependencies have actually changed
    const depsChanged = useCallback(() => {
        if (deps.length !== lastDepsRef.current.length) return true;
        return deps.some((dep, index) => dep !== lastDepsRef.current[index]);
    }, [deps]);

    // Fetch function with retry logic
    const fetchData = useCallback(async (retries = retryCount): Promise<T> => {
        try {
            // Check if there's already a pending request for this key
            const existingPromise = globalLoadingStates.get(cacheKey);
            if (existingPromise) {
                return await existingPromise;
            }

            // Create new request promise
            const requestPromise = fn();
            globalLoadingStates.set(cacheKey, requestPromise);

            try {
                const result = await requestPromise;

                // Cache the successful result
                globalCache.set(cacheKey, {
                    data: result,
                    timestamp: Date.now()
                });

                retryCountRef.current = 0;
                return result;
            } finally {
                // Clean up the loading state
                globalLoadingStates.delete(cacheKey);
            }
        } catch (error) {
            // Clean up loading state on error
            globalLoadingStates.delete(cacheKey);

            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                return fetchData(retries - 1);
            }

            throw error;
        }
    }, [cacheKey, fn, retryCount, retryDelay]);

    // Refetch function that can be called manually
    const refetch = useCallback(async () => {
        if (!mountedRef.current) return;

        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            // Force refresh by removing from cache
            globalCache.delete(cacheKey);
            const result = await fetchData();

            if (mountedRef.current) {
                setState({
                    data: result,
                    loading: false,
                    error: null
                });
            }

            return result;
        } catch (error) {
            if (mountedRef.current) {
                setState(prev => ({
                    ...prev,
                    loading: false,
                    error: error instanceof Error ? error.message : 'An error occurred'
                }));
            }
            throw error;
        }
    }, [cacheKey, fetchData]);

    // Main effect for fetching data
    useEffect(() => {
        if (!enabled) return;

        // Check if dependencies have changed
        if (!depsChanged() && state.data && !state.loading) {
            return;
        }

        // Update last dependencies
        lastDepsRef.current = [...deps];

        // Check cache first
        const cached = globalCache.get(cacheKey);
        if (cached && !isStale(cached.timestamp, staleTime)) {
            setState({
                data: cached.data,
                loading: false,
                error: null
            });
            return;
        }

        // Start loading
        setState(prev => ({ ...prev, loading: true, error: null }));

        fetchData()
            .then(result => {
                if (mountedRef.current) {
                    setState({
                        data: result,
                        loading: false,
                        error: null
                    });
                }
            })
            .catch(error => {
                if (mountedRef.current) {
                    setState(prev => ({
                        ...prev,
                        loading: false,
                        error: error instanceof Error ? error.message : 'An error occurred'
                    }));
                }
            });
    }, [enabled, cacheKey, staleTime, fetchData, depsChanged, state.data, state.loading]);

    // Window focus refetch
    useEffect(() => {
        if (!refetchOnWindowFocus) return;

        const handleFocus = () => {
            const cached = globalCache.get(cacheKey);
            if (cached && isStale(cached.timestamp, staleTime)) {
                refetch();
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [refetchOnWindowFocus, cacheKey, staleTime, refetch]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // Clean up old cache entries periodically
    useEffect(() => {
        const cleanup = () => {
            const now = Date.now();
            const keysToDelete: string[] = [];

            globalCache.forEach((value, key) => {
                if (now - value.timestamp > cacheTime) {
                    keysToDelete.push(key);
                }
            });

            keysToDelete.forEach(key => {
                globalCache.delete(key);
            });
        };

        const interval = setInterval(cleanup, cacheTime);
        return () => clearInterval(interval);
    }, [cacheTime]);

    return {
        data: state.data,
        loading: state.loading,
        error: state.error,
        refetch,
        // Helper to check if we have data
        isSuccess: !state.loading && !state.error && state.data !== null,
        isError: !state.loading && state.error !== null,
        isLoading: state.loading
    };
}

// Simplified hook for common use cases
export function useFetchWithParams<T = any>(
    baseKey: string,
    fetchFn: (params: any) => Promise<T>,
    params: any = {},
    options?: UseFetchOptions
) {
    const cacheKey = [baseKey, JSON.stringify(params)];

    return useAsyncFetch<T>({
        key: cacheKey,
        fn: () => fetchFn(params),
        deps: [params],
        options
    });
}

// Hook for paginated data
export function usePaginatedFetch<T = any>(
    baseKey: string,
    fetchFn: (params: any) => Promise<T>,
    params: {
        page?: number;
        search?: string;
        filters?: any;
        [key: string]: any;
    } = {},
    options?: UseFetchOptions
) {
    const {
        page = 1,
        search = '',
        filters = {},
        ...otherParams
    } = params;

    const cacheKey = [
        baseKey,
        page.toString(),
        search,
        JSON.stringify(filters),
        JSON.stringify(otherParams)
    ].filter(Boolean);

    return useAsyncFetch<T>({
        key: cacheKey,
        fn: () => fetchFn(params),
        deps: [page, search, filters, otherParams],
        options: {
            staleTime: 2 * 60 * 1000, // 2 minutes for paginated data
            ...options
        }
    });
}
