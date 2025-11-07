import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import React from "react";
import api from "@/util/api";
import { useApiResponse } from "./useApiResponse";

interface UseApiQueryOptions<TData = any, TError = any>
  extends Omit<UseQueryOptions<TData, TError>, "queryFn"> {
  endpoint: string;
  params?: Record<string, any>;
  enabled?: boolean;
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

interface UseApiMutationOptions<TData = any, TError = any, TVariables = any>
  extends Omit<UseMutationOptions<TData, TError, TVariables>, "mutationFn"> {
  endpoint: string;
  method?: "POST" | "PATCH" | "PUT" | "DELETE";
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: TError, variables: TVariables) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  invalidateQueries?: string[];
}

/**
 * Hook for GET requests with TanStack Query
 * Supports caching, stale time, refetching, and automatic toast notifications
 */
export function useApiQuery<TData = any, TError = any>(
  options: UseApiQueryOptions<TData, TError>
) {
  const {
    endpoint,
    params,
    enabled = true,
    onSuccess,
    onError,
    showSuccessToast = false,
    showErrorToast = true,
    ...queryOptions
  } = options;

  const { handleError, handleSuccess } = useApiResponse();

  // Extract queryKey from queryOptions if provided
  const { queryKey: customQueryKey, ...restQueryOptions } = queryOptions as any;

  const query = useQuery<TData, TError>({
    queryKey: customQueryKey || [endpoint, params],
    queryFn: async () => {
      // API interceptor already returns response.data, so response is the data object
      const response = await api.get(endpoint, { params });
      return response;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - cache persists for 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 1,
    ...restQueryOptions,
  });

  // Handle success and error callbacks separately
  React.useEffect(() => {
    if (query.isSuccess && query.data) {
      if (showSuccessToast) {
        handleSuccess({ data: { data: query.data } });
      }
      onSuccess?.(query.data);
    }
  }, [query.isSuccess, query.data, showSuccessToast, onSuccess, handleSuccess]);

  React.useEffect(() => {
    if (query.isError && query.error) {
      if (showErrorToast) {
        handleError(query.error as any);
      }
      onError?.(query.error);
    }
  }, [query.isError, query.error, showErrorToast, onError, handleError]);

  return query;
}

/**
 * Hook for POST requests with TanStack Query
 * Supports optimistic updates, cache invalidation, and automatic toast notifications
 */
export function useApiPost<TData = any, TError = any, TVariables = any>(
  options: UseApiMutationOptions<TData, TError, TVariables>
) {
  const {
    endpoint,
    method = "POST",
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
    invalidateQueries = [],
    ...mutationOptions
  } = options;

  const { handleError, handleSuccess } = useApiResponse();
  const queryClient = useQueryClient();

  const mutation = useMutation<TData, TError, TVariables>({
    mutationFn: async (variables: TVariables) => {
      let response;
      switch (method) {
        case "POST":
          response = await api.post(endpoint, variables);
          break;
        case "PATCH":
          response = await api.patch(endpoint, variables);
          break;
        case "PUT":
          response = await api.put(endpoint, variables);
          break;
        case "DELETE":
          response = await api.delete(endpoint, { data: variables });
          break;
        default:
          response = await api.post(endpoint, variables);
      }
      return response.data || response;
    },
    ...mutationOptions,
    onSuccess: (data, variables) => {
      // Invalidate and refetch queries
      invalidateQueries.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      });

      if (showSuccessToast) {
        handleSuccess({ data: { data } });
      }
      onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      if (showErrorToast) {
        handleError(error as any);
      }
      onError?.(error, variables);
    },
  });

  return mutation;
}

/**
 * Hook for PATCH requests with TanStack Query
 */
export function useApiPatch<TData = any, TError = any, TVariables = any>(
  options: UseApiMutationOptions<TData, TError, TVariables>
) {
  return useApiPost<TData, TError, TVariables>({ ...options, method: "PATCH" });
}

/**
 * Hook for PUT requests with TanStack Query
 */
export function useApiPut<TData = any, TError = any, TVariables = any>(
  options: UseApiMutationOptions<TData, TError, TVariables>
) {
  return useApiPost<TData, TError, TVariables>({ ...options, method: "PUT" });
}

/**
 * Hook for DELETE requests with TanStack Query
 */
export function useApiDelete<TData = any, TError = any, TVariables = any>(
  options: UseApiMutationOptions<TData, TError, TVariables>
) {
  return useApiPost<TData, TError, TVariables>({
    ...options,
    method: "DELETE",
  });
}
