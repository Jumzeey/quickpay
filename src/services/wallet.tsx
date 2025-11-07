import { useApiQuery } from '@/hooks/useTanStackQuery';
import { apiEndpoints } from '@/util/endpoints';

export interface Wallet {
    account_id: string;
    account_name: string;
    account_type: 'main' | 'reserve';
    available_balance: string;
    ledger_balance: string;
    locked_balance: string;
    currency: string;
}

export interface WalletsResponse {
    status: boolean;
    message: string;
    data: {
        balances: Wallet[];
    };
}

export interface WalletTransaction {
    transaction_reference: string;
    action: string;
    amount: string;
    currency: string;
    balance_before: string;
    balance_after: string;
    created_at: string;
    description?: string;
}

export interface WalletTransactionsResponse {
    status: boolean;
    message: string;
    data: {
        wallet: WalletTransaction[];
    };
}

/**
 * Hook to fetch all wallets
 */
export function useWallets() {
    return useApiQuery<WalletsResponse>({
        endpoint: apiEndpoints.transaction.GET_WALLETS,
        queryKey: ['wallets'] as any,
        staleTime: 2 * 60 * 1000, // 2 minutes - wallets can be cached for 2 minutes
        gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
        showErrorToast: true,
    });
}

/**
 * Hook to fetch wallet transactions
 */
export function useWalletTransactions(
    params?: {
        account_id?: string;
        currency?: string;
        page?: number;
        per_page?: number;
        search?: string;
        start_date?: string;
        end_date?: string;
    },
    options?: {
        enabled?: boolean;
    }
) {
    return useApiQuery<WalletTransactionsResponse>({
        endpoint: apiEndpoints.transaction.GET_WALLET_HISTORY,
        params,
        queryKey: ['wallet-transactions', params] as any,
        staleTime: 1 * 60 * 1000, // 1 minute - transactions refresh more frequently
        gcTime: 3 * 60 * 1000, // 3 minutes (formerly cacheTime)
        showErrorToast: true,
        enabled: options?.enabled !== false && !!params?.account_id, // Only fetch when account_id is provided
    });
}

