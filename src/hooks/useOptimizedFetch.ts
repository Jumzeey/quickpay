import { useCallback, useEffect, useRef } from 'react';

// Cache for storing request states to prevent duplicate calls
const requestCache = new Map<string, {
    promise: Promise<any> | null;
    lastCall: number;
    data?: any;
}>();

const CACHE_DURATION = 5000; // 5 seconds to prevent rapid successive calls

interface UseStoreQueryOptions {
    enabled?: boolean;
    cacheTime?: number;
    onSuccess?: (data: any) => void;
    onError?: (error: any) => void;
}

/**
 * Hook to work with existing Zustand stores and prevent redundant API calls
 * This integrates with your current store pattern while adding smart caching
 */
export function useStoreQuery<T = any>(
    key: string,
    storeAction: (...args: any[]) => Promise<T>,
    params: any[] = [],
    options: UseStoreQueryOptions = {}
) {
    const {
        enabled = true,
        cacheTime = CACHE_DURATION,
        onSuccess,
        onError
    } = options;

    const mountedRef = useRef(true);
    const lastParamsRef = useRef<string>('');

    // Create a unique cache key based on action name and parameters
    const cacheKey = `${key}:${JSON.stringify(params)}`;
    const currentParamsKey = JSON.stringify(params);

    // Check if parameters have changed
    const paramsChanged = currentParamsKey !== lastParamsRef.current;

    const executeQuery = useCallback(async () => {
        if (!enabled || !mountedRef.current) return;

        const now = Date.now();
        const cached = requestCache.get(cacheKey);

        // If there's an ongoing request for the same key, wait for it
        if (cached?.promise) {
            try {
                const result = await cached.promise;
                if (mountedRef.current && onSuccess) {
                    onSuccess(result);
                }
                return result;
            } catch (error) {
                if (mountedRef.current && onError) {
                    onError(error);
                }
                throw error;
            }
        }

        // If we have recent data and params haven't changed, don't refetch
        if (cached?.lastCall &&
            (now - cached.lastCall) < cacheTime &&
            !paramsChanged) {
            return cached.data;
        }

        // Create new request
        const promise = storeAction(...params);

        // Cache the promise to prevent duplicate requests
        requestCache.set(cacheKey, {
            promise,
            lastCall: now
        });

        try {
            const result = await promise;

            // Update cache with result
            requestCache.set(cacheKey, {
                promise: null,
                lastCall: now,
                data: result
            });

            if (mountedRef.current && onSuccess) {
                onSuccess(result);
            }

            return result;
        } catch (error) {
            // Clear the failed request from cache
            requestCache.delete(cacheKey);

            if (mountedRef.current && onError) {
                onError(error);
            }
            throw error;
        }
    }, [cacheKey, enabled, storeAction, params, cacheTime, paramsChanged, onSuccess, onError]);

    // Execute query when params change or on mount
    useEffect(() => {
        if (paramsChanged || !requestCache.has(cacheKey)) {
            lastParamsRef.current = currentParamsKey;
            executeQuery().catch(() => {
                // Error is already handled in executeQuery
            });
        }
    }, [executeQuery, cacheKey, paramsChanged, currentParamsKey]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    return {
        refetch: executeQuery,
        invalidate: () => {
            requestCache.delete(cacheKey);
            lastParamsRef.current = '';
        }
    };
}

/**
 * Hook specifically for paginated queries with search and filters
 * Integrates with your existing pattern while preventing redundant calls
 */
export function usePaginatedStoreQuery<T = any>(
    storeHook: any, // Your zustand store hook
    actionName: string, // The action method name (e.g., 'fetchCollectionHistory')
    params: {
        page?: number;
        search?: string;
        status?: string;
        startDate?: any;
        endDate?: any;
        [key: string]: any;
    } = {},
    options: UseStoreQueryOptions = {}
) {
    const store = storeHook();
    const action = store[actionName];
    const loading = store[`get${actionName.charAt(0).toUpperCase() + actionName.slice(1)}Loading`] || false;

    const {
        page = 1,
        search = '',
        status = '',
        startDate = null,
        endDate = null,
        ...otherParams
    } = params;

    // Create parameters array for the action
    const actionParams = [{
        page,
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
        ...(startDate ? {
            start_date: typeof startDate === 'string' ? startDate : startDate,
            end_date: typeof endDate === 'string' ? endDate : endDate
        } : {}),
        ...otherParams
    }];

    const queryKey = `${actionName}:${JSON.stringify(actionParams)}`;

    return useStoreQuery(
        queryKey,
        action,
        actionParams,
        {
            ...options,
            cacheTime: 3000 // Shorter cache for paginated data
        }
    );
}

/**
 * Enhanced version of the original useFetch that prevents redundant calls
 * while maintaining backward compatibility
 */
export function useFetch({ filter, fns }: { filter: string; fns: (filter: string) => void }) {
    const prevFilterRef = useRef<string | null>(null);
    const lastCallRef = useRef<number>(0);
    const isCallingRef = useRef<boolean>(false);

    useEffect(() => {
        const now = Date.now();

        // Prevent calls if:
        // 1. Filter hasn't changed
        // 2. Filter is empty
        // 3. We're already calling
        // 4. Too soon since last call
        if (filter === prevFilterRef.current ||
            filter === '' ||
            isCallingRef.current ||
            (now - lastCallRef.current) < 1000) {
            return;
        }

        isCallingRef.current = true;
        lastCallRef.current = now;

        try {
            fns(filter);
            prevFilterRef.current = filter;
        } finally {
            // Reset the calling flag after a short delay
            setTimeout(() => {
                isCallingRef.current = false;
            }, 500);
        }
    }, [filter, fns]);
}

// Cleanup old cache entries periodically
setInterval(() => {
    const now = Date.now();
    const keysToDelete: string[] = [];

    requestCache.forEach((value, key) => {
        if (value.lastCall && (now - value.lastCall) > 30000) { // 30 seconds
            keysToDelete.push(key);
        }
    });

    keysToDelete.forEach(key => {
        requestCache.delete(key);
    });
}, 60000); // Run every minute
