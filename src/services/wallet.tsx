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
 * Helper function to validate if an account_id is a real UUID (not a fallback like "main_NGN")
 */
function isValidAccountId(accountId: string | undefined): boolean {
    if (!accountId || !accountId.trim()) return false;
    
    // Real account_ids are UUIDs (contain dashes and are longer)
    // Fallback account_ids like "main_NGN" or "reserve_USD" don't contain dashes
    // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    return accountId.includes('-') && accountId.length > 20;
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
    // Validate account_id - only fetch if it's a real UUID, not a fallback
    const isValidId = isValidAccountId(params?.account_id);
    
    return useApiQuery<WalletTransactionsResponse>({
        endpoint: apiEndpoints.transaction.GET_WALLET_HISTORY,
        params,
        queryKey: ['wallet-transactions', params] as any,
        staleTime: 1 * 60 * 1000, // 1 minute - transactions refresh more frequently
        gcTime: 3 * 60 * 1000, // 3 minutes (formerly cacheTime)
        showErrorToast: true,
        // Only fetch when account_id is provided AND it's a valid UUID (not a fallback)
        enabled: options?.enabled !== false && isValidId,
    });
}

