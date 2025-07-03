import { useCallback, useEffect, useRef } from 'react';

// Cache for storing request states to prevent duplicate calls
const requestCache = new Map<string, {
    promise: Promise<any> | null;
    lastCall: number;
    data?: any;
}>();

const CACHE_DURATION = 5000;

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

    const mountedRef = useRef(false);
    const lastParamsRef = useRef<string>('');
    const isInitialQueryRef = useRef(true);

    const cacheKey = `${key}:${JSON.stringify(params)}`;
    const currentParamsKey = JSON.stringify(params);
    const paramsChanged = currentParamsKey !== lastParamsRef.current;

    const executeQuery = useCallback(async (force = false) => {
        if (!enabled || !mountedRef.current) return;
       
        const now = Date.now();
        const cached = requestCache.get(cacheKey);

        if (cached?.promise) {
            return cached.promise;
        }

        const shouldRefetch = force || paramsChanged || !cached?.lastCall || (now - cached.lastCall) > cacheTime;

        if (!shouldRefetch && cached?.data) {
            if (onSuccess) onSuccess(cached.data);
            return cached.data;
        }

        const promise = storeAction(...params);
        requestCache.set(cacheKey, { promise, lastCall: now, data: null });

        try {
            const result = await promise;
            if (mountedRef.current) {
                requestCache.set(cacheKey, { promise: null, lastCall: now, data: result });
                if (onSuccess) onSuccess(result);
            }
            return result;
        } catch (error) {
            if (mountedRef.current) {
                requestCache.delete(cacheKey);
                if (onError) onError(error);
            }
            throw error;
        }
    }, [key, enabled, JSON.stringify(params), cacheTime, onSuccess, onError, storeAction]);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (enabled) {
            // Run if it's the first time the query is enabled, or if params have changed since last run.
            if (isInitialQueryRef.current || paramsChanged) {
                executeQuery().catch((error) => {
                    console.error('Query execution failed:', error);
                });
                lastParamsRef.current = currentParamsKey;
                isInitialQueryRef.current = false;
            }
        } else {
            isInitialQueryRef.current = true;
        }
    }, [enabled, currentParamsKey, executeQuery]);

    return {
        refetch: () => executeQuery(true),
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
    storeHook: any,
    actionName: string,
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

    const actionParams = [{
        page,
        ...(search && search.trim() ? { search: search.trim() } : {}),
        ...(status ? { status } : {}),
        ...(startDate ? {
            start_date: typeof startDate === 'string' ? startDate : startDate,
            end_date: typeof endDate === 'string' ? endDate : endDate
        } : {}),
        ...otherParams
    }];

    const queryKey = `${actionName}:${JSON.stringify({
        page,
        search: search.trim(),
        status,
        startDate,
        endDate,
        ...otherParams
    })}`;


    const queryResult = useStoreQuery(
        queryKey,
        action,
        actionParams,
        {
            ...options,
            cacheTime: 1000,
            onSuccess: (data) => options.onSuccess?.(data),
            onError: (error) => {
                console.error('❌ Query failed for:', actionName, error);
                options.onError?.(error);
            }
        }
    );

    return {
        ...queryResult,
        loading
    };
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

        if (filter === prevFilterRef.current ||
            filter === '' ||
            isCallingRef.current ||
            (now - lastCallRef.current) < 500) {
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
