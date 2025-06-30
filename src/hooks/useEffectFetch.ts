import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface UseEffectFetchState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

/**
 * Hook to replace useEffect + fetch patterns that cause performance issues
 * Prevents redundant API calls and provides better dependency management
 */
export function useEffectFetch<T = any>(
    fetchFunction: (...args: any[]) => Promise<T>,
    dependencies: any[],
    options: {
        enabled?: boolean;
        debounceMs?: number;
        skipFirst?: boolean;
        onSuccess?: (data: T) => void;
        onError?: (error: any) => void;
    } = {}
) {
    const {
        enabled = true,
        debounceMs = 0,
        skipFirst = false,
        onSuccess,
        onError
    } = options;

    const [state, setState] = useState<UseEffectFetchState<T>>({
        data: null,
        loading: false,
        error: null
    });

    const isFirstRun = useRef(true);
    const lastDepsRef = useRef<string>('');
    const timeoutRef = useRef<NodeJS.Timeout>();
    const lastFetchRef = useRef<number>(0);
    const abortControllerRef = useRef<AbortController>();
    const mountedRef = useRef(true);

    // Ensure mountedRef is always true when the hook is active
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // Create a stable string representation of dependencies
    const depsString = useMemo(() => {
        try {
            return JSON.stringify(dependencies);
        } catch (error) {
            // Fallback for non-serializable dependencies
            return dependencies.map((dep, index) => `${index}:${String(dep)}`).join('|');
        }
    }, [dependencies]);

    const executeFetch = useCallback(async () => {
        if (!enabled || !mountedRef.current) {
            return;
        }

        // Skip first run if requested
        if (skipFirst && isFirstRun.current) {
            isFirstRun.current = false;
            lastDepsRef.current = depsString;
            return;
        }

        // Cancel previous request if still pending
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();

        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const now = Date.now();
            lastFetchRef.current = now;

            const result = await fetchFunction();

            // Only process result if this is still the latest request and component is mounted
            if (lastFetchRef.current === now && mountedRef.current) {
                setState(prev => ({ ...prev, data: result, loading: false }));
                onSuccess?.(result);
                lastDepsRef.current = depsString;
            } 

            return result;
        } catch (error: any) {
            // Ignore aborted requests
            if (error.name === 'AbortError') {
                return;
            }

            if (mountedRef.current) {
                setState(prev => ({
                    ...prev,
                    loading: false,
                    error: error instanceof Error ? error.message : 'An error occurred'
                }));
                onError?.(error);
                lastDepsRef.current = depsString;
            }
            throw error;
        }
    }, [fetchFunction, enabled, skipFirst, onSuccess, onError, depsString]);

    const debouncedExecuteFetch = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (debounceMs > 0) {
            timeoutRef.current = setTimeout(executeFetch, debounceMs);
        } else {
            executeFetch();
        }
    }, [executeFetch, debounceMs]);

    useEffect(() => {
        // Check if this is the first run
        if (isFirstRun.current) {
            isFirstRun.current = false;
            lastDepsRef.current = depsString;

            if (!skipFirst) {
                debouncedExecuteFetch();
            }
            return;
        }

        // Only fetch if dependencies have actually changed
        if (depsString !== lastDepsRef.current) {
            lastDepsRef.current = depsString;
            debouncedExecuteFetch();
        }
    }, [depsString, debouncedExecuteFetch, skipFirst]);

    // Cleanup timeouts and abort controllers on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    return {
        ...state,
        refetch: executeFetch,
        cancel: () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        }
    };
}

/**
 * Specialized hook for paginated data fetching
 * Replaces common useEffect patterns for pagination, search, and filtering
 */
export function usePaginatedEffect<T = any>(
    fetchFunction: (params: any) => Promise<T>,
    params: {
        page?: number;
        search?: string;
        status?: string;
        startDate?: any;
        endDate?: any;
        filters?: Record<string, any>;
        [key: string]: any;
    },
    options: {
        enabled?: boolean;
        debounceMs?: number;
        onSuccess?: (data: T) => void;
        onError?: (error: any) => void;
    } = {}
) {
    const {
        page = 1,
        search = '',
        status = '',
        startDate = null,
        endDate = null,
        filters = {},
        ...otherParams
    } = params;

    // Create clean params object with proper date formatting
    const cleanParams = useMemo(() => {
        const result: any = { page };

        if (search) result.search = search;
        if (status) result.status = status;
        if (Object.keys(filters).length > 0) Object.assign(result, filters);
        if (Object.keys(otherParams).length > 0) Object.assign(result, otherParams);

        // Handle date formatting if dates are provided
        if (startDate && endDate) {
            // Import formatDate dynamically to avoid circular dependencies
            const formatDate = (date: any) => {
                if (typeof date === 'string') return date;
                if (date && typeof date.toISOString === 'function') {
                    return date.toISOString().split('T')[0];
                }
                return date;
            };

            result.start_date = formatDate(startDate);
            result.end_date = formatDate(endDate);
        }

        return result;
    }, [page, search, status, startDate, endDate, filters, otherParams]);

    return useEffectFetch(
        () => {
            return fetchFunction(cleanParams);
        },
        [cleanParams],
        {
            debounceMs: search ? 300 : 0, // Debounce search but not pagination
            ...options
        }
    );
}

/**
 * Hook for data that depends on route parameters or selected items
 * Common pattern in detail pages
 */
export function useRouteEffect<T = any>(
    fetchFunction: (id: string | string[]) => Promise<T>,
    id: string | string[] | undefined,
    dependencies: any[] = [],
    options: {
        enabled?: boolean;
        onSuccess?: (data: T) => void;
        onError?: (error: any) => void;
    } = {}
) {
    const { enabled = true, ...restOptions } = options;

    return useEffectFetch(
        () => fetchFunction(id!),
        [id, ...dependencies],
        {
            enabled: enabled && !!id,
            ...restOptions
        }
    );
}
