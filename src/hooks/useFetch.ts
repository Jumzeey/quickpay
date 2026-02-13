import { useEffect, useMemo, useRef } from "react";

type IUseFetch = {
  filter: string;
  fns: (filter: string) => void;
};

// Cache to track ongoing requests and prevent duplicates
const requestCache = new Map<
  string,
  {
    isActive: boolean;
    lastCall: number;
  }
>();

export function useFetch({ filter, fns }: IUseFetch) {
  const prevFilterRef = useRef<string | null>(null);
  const isCallingRef = useRef<boolean>(false);

  useMemo(() => {
    // Early returns to prevent unnecessary calls
    if (filter === prevFilterRef.current) return;
    if (filter === "") return;
    if (isCallingRef.current) return;

    // Lazily evict stale entries on access
    cleanupStaleEntries();

    const now = Date.now();
    const cached = requestCache.get(filter);

    // Prevent rapid successive calls (within 1 second)
    if (cached && now - cached.lastCall < 1000) {
      return;
    }

    // Prevent concurrent calls for the same filter
    if (cached?.isActive) {
      return;
    }

    // Mark as active and execute
    isCallingRef.current = true;
    requestCache.set(filter, {
      isActive: true,
      lastCall: now,
    });

    try {
      fns(filter);
      prevFilterRef.current = filter;
    } finally {
      // Reset flags after execution
      setTimeout(() => {
        isCallingRef.current = false;
        const entry = requestCache.get(filter);
        if (entry) {
          requestCache.set(filter, {
            ...entry,
            isActive: false,
          });
        }
      }, 100);
    }
  }, [filter, fns]);
}

// Enhanced version with more control
export function useOptimizedFetch({
  key,
  fn,
  enabled = true,
  debounceMs = 1000,
}: {
  key: string;
  fn: () => void;
  enabled?: boolean;
  debounceMs?: number;
}) {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!enabled) return;

    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If enough time has passed, execute immediately
    if (timeSinceLastCall >= debounceMs) {
      lastCallRef.current = now;
      fn();
    } else {
      // Otherwise, debounce
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        fn();
      }, debounceMs - timeSinceLastCall);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [key, fn, enabled, debounceMs]);
}

// Lazy cache cleanup: evict stale entries when cache is accessed
function cleanupStaleEntries() {
  const now = Date.now();
  requestCache.forEach((value, key) => {
    if (now - value.lastCall > 60000) {
      // 1 minute
      requestCache.delete(key);
    }
  });
}
