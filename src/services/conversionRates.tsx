import { useQuery } from '@tanstack/react-query';
import api from '@/util/api';
import { apiEndpoints } from '@/util/endpoints';

export interface ConversionRateResponse {
    success: boolean;
    data?: {
        id: number;
        source_currency: string;
        destination_currency: string;
        rate: string;
        sla: number;
        settlement: string;
        status: string;
        created_at: string;
        updated_at: string;
        created_by: number;
    };
    message?: string;
}

export interface ConversionRateParams {
    source_currency: string;
    destination_currency: string;
}

/**
 * Hook to fetch conversion rate between two currencies
 * Uses POST request as required by the API
 */
export function useConversionRate(
    sourceCurrency: string,
    destinationCurrency: string,
    options?: {
        enabled?: boolean;
    }
) {
    const shouldFetch =
        (options?.enabled ?? true) &&
        !!sourceCurrency &&
        !!destinationCurrency &&
        sourceCurrency !== destinationCurrency;

    const query = useQuery<ConversionRateResponse>({
        queryKey: ['conversion-rate', sourceCurrency, destinationCurrency],
        queryFn: async (): Promise<ConversionRateResponse> => {
            // API interceptor already returns response.data, so response is the data object
            const response = await api.post(
                apiEndpoints.conversions.GET_RATES,
                {
                    source_currency: sourceCurrency,
                    destination_currency: destinationCurrency,
                }
            ) as unknown as ConversionRateResponse;
            return response;
        },
        enabled: shouldFetch,
        staleTime: 0, // Always consider data stale for real-time rates
        gcTime: 0, // Don't cache at all
        refetchOnMount: true, // Always refetch on mount
        refetchOnWindowFocus: false,
        retry: 1,
    });

    return {
        data: query.data,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    };
}

