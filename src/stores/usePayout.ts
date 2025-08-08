import {
    addInterBankPayout,
    getBankList,
    getPayoutHistory,
    InterbankPayoutPayload,
    raiseDispute,
    requeryPayout,
    RequeryPayoutResponse,
    requestRefund,
    validateBankAccount,
    verifyPayoutOtp,
    viewPayout,
    type Payout,
    type PayoutHistoryParams,
    type PayoutHistoryResponse,
} from "@/services/payout";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface Bank {
    name: string;
    code: string;
    logo?: string;
}

interface PayoutFilters {
    search: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
}

interface PayoutPagination {
    count: number;
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

interface PendingPayout {
    amount: string;
    bank_code: string;
    account_number: string;
    account_name?: string;
    total_charge?: string;
}

interface PayoutState {
    // Loading states
    payoutHistoryLoading: boolean;
    initiatePayoutLoading: boolean;
    verifyOtpLoading: boolean;
    viewPayoutLoading: boolean;
    bankValidationLoading: boolean;
    banksLoading: boolean;
    requeryLoading: boolean;
    requestRefundLoading: boolean;
    raiseDisputeLoading: boolean;
    requeryData: RequeryPayoutResponse | null;

    // Data - no initial mock data, should come from API
    payouts: Payout[];
    banks: Bank[];
    currentPayout: Payout | null;
    pendingPayout: PendingPayout | null;

    // Pagination
    pagination: PayoutPagination;

    // Error states
    error: string | null;
    bankValidationError: string | null;

    // UI states
    filters: PayoutFilters;
}

export interface RequestRefundPayload {
    reference: string;
    amount: number;
    reason: string;
    description: string;
}

export interface RaiseDisputePayload {
    category: string;
    description: string;
}

interface PayoutActions {
    // Filter actions
    setFilters: (newFilters: Partial<PayoutFilters>) => void;
    clearError: () => void;

    // API actions
    fetchPayoutHistory: (params?: PayoutHistoryParams) => Promise<{ success: boolean; data?: PayoutHistoryResponse }>;
    initiateInterBankPayout: (payload: any) => Promise<{ success: boolean; message?: string; data?: any; requiresOtp?: boolean }>;
    verifyPayoutOtp: (payload: { otp: string; }) => Promise<{ success: boolean; message?: string; data?: any }>;
    viewPayout: (id: string) => Promise<{ success: boolean; data?: Payout }>;
    validateBankAccount: (bankCode: string, accountNumber: string) => Promise<{ success: boolean; account_name?: string }>;
    fetchBanks: () => Promise<{ success: boolean; data?: Bank[] }>;
    exportPayoutHistory: (params?: PayoutHistoryParams) => Promise<{ success: boolean; export_link?: string }>;
    requeryPayout: (reference: string) => Promise<{ success: boolean; data?: RequeryPayoutResponse }>;
    requestRefund: (payload: RequestRefundPayload) => Promise<{ success: boolean; data?: any }>;
    raiseDispute: (payload: RaiseDisputePayload) => Promise<{ success: boolean; data?: any }>;

    // Utility actions
    reset: () => void;

    // Legacy methods for backward compatibility
    postPayoutAccount: (payload: any) => Promise<{ success: boolean; message?: string; data?: any; requiresOtp?: boolean }>;
}

type PayoutStore = PayoutState & PayoutActions;

const initialState: PayoutState = {
    // Loading states
    payoutHistoryLoading: false,
    initiatePayoutLoading: false,
    verifyOtpLoading: false,
    viewPayoutLoading: false,
    bankValidationLoading: false,
    banksLoading: false,
    requeryLoading: false,
    requestRefundLoading: false,
    raiseDisputeLoading: false,
    requeryData: null,

    // Data - no mock data, should come from API
    payouts: [],
    banks: [],
    currentPayout: null,
    pendingPayout: null,

    // Pagination
    pagination: {
        count: 0,
        total: 0,
        per_page: 20,
        current_page: 1,
        last_page: 1,
    },

    // Error states
    error: null,
    bankValidationError: null,

    // UI states
    filters: {
        search: "",
        status: "",
        startDate: null,
        endDate: null,
    },
};

const usePayout = create<PayoutStore>()(
    devtools(
        (set, get) => ({
            ...initialState,

            // Actions
            setFilters: (newFilters: Partial<PayoutFilters>) => {
                set((state) => ({
                    ...state,
                    filters: { ...state.filters, ...newFilters },
                }));
            },

            clearError: () => {
                set((state) => ({
                    ...state,
                    error: null,
                    bankValidationError: null,
                }));
            },

            fetchPayoutHistory: async (params: PayoutHistoryParams = {}) => {
                const state = get();

                // Don't fetch if already loading
                if (state.payoutHistoryLoading) {
                    return { success: false };
                }

                set((state) => ({
                    ...state,
                    payoutHistoryLoading: true,
                    error: null,
                }));

                try {
                    // Properly construct search parameters with correct types
                    const searchParams: PayoutHistoryParams = {
                        page: state.pagination.current_page,
                        per_page: state.pagination.per_page,
                        currency: params.currency || "NGN",
                        ...params,
                    };

                    // Add filters with proper type checking
                    if (state.filters.search) {
                        searchParams.search = state.filters.search;
                    }

                    if (state.filters.status && state.filters.status !== "") {
                        // Ensure status is one of the allowed values
                        const validStatuses = ["pending", "successful", "failed", "processing"];
                        if (validStatuses.includes(state.filters.status)) {
                            searchParams.status = state.filters.status as "pending" | "successful" | "failed" | "processing";
                        }
                    }

                    if (state.filters.startDate) {
                        searchParams.start_date = state.filters.startDate;
                    }

                    if (state.filters.endDate) {
                        searchParams.end_date = state.filters.endDate;
                    }

                    const response = await getPayoutHistory(searchParams);

                    set((state) => ({
                        ...state,
                        payouts: response.disbursements || [],
                        pagination: response.pagination || state.pagination,
                        payoutHistoryLoading: false,
                    }));

                    return { success: true, data: response };
                } catch (error: any) {
                    set((state) => ({
                        ...state,
                        error: error.message || "Failed to fetch payout history",
                        payoutHistoryLoading: false,
                        // payouts: [],
                    }));
                    throw error;
                }
            },

            initiateInterBankPayout: async (payload: InterbankPayoutPayload) => {
                const state = get();

                // Don't initiate if already loading
                if (state.initiatePayoutLoading) {
                    return { success: false };
                }

                set((state) => ({
                    ...state,
                    initiatePayoutLoading: true,
                    error: null,
                }));

                try {
                    const response = await addInterBankPayout(payload);

                    set((state) => ({
                        ...state,
                        pendingPayout: {
                            ...payload,
                            total_charge: response.data?.total_charge,
                        },
                        initiatePayoutLoading: false,
                    }));

                    return {
                        success: true,
                        message: response.message,
                        data: response.data,
                    };
                } catch (error: any) {
                    set((state) => ({
                        ...state,
                        error: error.message || "Failed to initiate payout",
                        initiatePayoutLoading: false,
                    }));
                    throw error;
                }
            },

            verifyPayoutOtp: async (payload: { otp: string }) => {
                const state = get();

                if (state.verifyOtpLoading) {
                    return { success: false };
                }

                set((state) => ({
                    ...state,
                    verifyOtpLoading: true,
                    error: null,
                }));

                try {
                    const response = await verifyPayoutOtp(payload);

                    // Refresh payout history after successful completion
                    await get().fetchPayoutHistory();

                    set((state) => ({
                        ...state,
                        pendingPayout: null,
                        verifyOtpLoading: false,
                    }));

                    return {
                        success: true,
                        message: response.message,
                        data: response.data,
                    };
                } catch (error: any) {
                    set((state) => ({
                        ...state,
                        error: error.message || "Failed to verify OTP",
                        verifyOtpLoading: false,
                    }));
                    throw error;
                }
            },

            viewPayout: async (id: string) => {
                const state = get();

                // Don't fetch if already loading
                if (state.viewPayoutLoading) {
                    return { success: false };
                }

                set((state) => ({
                    ...state,
                    viewPayoutLoading: true,
                    error: null,
                }));

                try {
                    const response = await viewPayout(id);

                    set((state) => ({
                        ...state,
                        currentPayout: response.payout,
                        viewPayoutLoading: false,
                    }));

                    return {
                        success: true,
                        data: response.payout,
                    };
                } catch (error: any) {
                    set((state) => ({
                        ...state,
                        error: error.message || "Failed to fetch payout details",
                        viewPayoutLoading: false,
                    }));
                    throw error;
                }
            },

            validateBankAccount: async (bankCode: string, accountNumber: string) => {
                const state = get();

                // Don't validate if already loading
                if (state.bankValidationLoading) {
                    return { success: false };
                }

                set((state) => ({
                    ...state,
                    bankValidationLoading: true,
                    bankValidationError: null,
                }));

                try {
                    const response = await validateBankAccount(bankCode, accountNumber);

                    set((state) => ({
                        ...state,
                        bankValidationLoading: false,
                    }));

                    return {
                        success: true,
                        account_name: response.account_name,
                    };
                } catch (error: any) {
                    set((state) => ({
                        ...state,
                        bankValidationError: error.message || "Failed to validate bank account",
                        bankValidationLoading: false,
                    }));
                    throw error;
                }
            },

            fetchBanks: async () => {
                const state = get();

                if (state.banksLoading || state.banks.length > 0) {
                    return { success: true, data: state.banks };
                }

                set((state) => ({
                    ...state,
                    banksLoading: true,
                    error: null,
                }));

                try {
                    const response = await getBankList();

                    set((state) => ({
                        ...state,
                        banks: response.banks || [],
                        banksLoading: false,
                    }));

                    return {
                        success: true,
                        data: response.banks,
                    };
                } catch (error: any) {
                    set((state) => ({
                        ...state,
                        error: error.message || "Failed to fetch banks",
                        banksLoading: false,
                    }));
                    throw error;
                }
            },

            exportPayoutHistory: async (params: PayoutHistoryParams = {}) => {
                try {
                    const response = await getPayoutHistory({ ...params, export: true });
                    return {
                        success: true,
                        export_link: response.export_link,
                    };
                } catch (error: any) {
                    throw error;
                }
            },

            requeryPayout: async (reference: string) => {
                const state = get();

                if (state.requeryLoading) {
                    return { success: false };
                }

                set((state) => ({
                    ...state,
                    requeryLoading: true,
                    error: null,
                }));

                try {
                    const response = await requeryPayout(reference);
                    console.log({ response });

                    set((state) => ({
                        ...state,
                        requeryData: response,
                        requeryLoading: false,
                    }));

                    if (response.Transaction.success) {
                        await get().fetchPayoutHistory();
                    }

                    return {
                        success: true,
                        data: response,
                    };
                } catch (error: any) {
                    set((state) => ({
                        ...state,
                        error: error.message || "Failed to requery payout",
                        requeryLoading: false,
                    }));
                    throw error;
                }
            },

            requestRefund: async (payload: RequestRefundPayload) => {
                const state = get();

                if (state.requestRefundLoading) {
                    return { success: false };
                }

                set((state) => ({
                    ...state,
                    requestRefundLoading: true,
                    error: null,
                }));

                try {
                    const response = await requestRefund(payload);
                    console.log({ response });

                    set((state) => ({
                        ...state,
                        requestRefundLoading: false,
                    }));

                    await get().fetchPayoutHistory();

                    return {
                        success: true,
                        data: response,
                    };
                } catch (error: any) {
                    set((state) => ({
                        ...state,
                        error: error.message || "Failed to request refund",
                        requestRefundLoading: false,
                    }));
                    throw error;
                }
            },

            raiseDispute: async (payload: RaiseDisputePayload) => {
                const state = get();

                if (state.raiseDisputeLoading) {
                    return { success: false };
                }

                set((state) => ({
                    ...state,
                    raiseDisputeLoading: true,
                    error: null,
                }));

                try {
                    const response = await raiseDispute(payload);
                    console.log({ response });

                    set((state) => ({
                        ...state,
                        raiseDisputeLoading: false,
                    }));

                    await get().fetchPayoutHistory();

                    return {
                        success: true,
                        data: response,
                    };
                } catch (error: any) {
                    set((state) => ({
                        ...state,
                        error: error.message || "Failed to raise dispute",
                        raiseDisputeLoading: false,
                    }));
                    throw error;
                }
            },

            // Reset store to initial state
            reset: () => {
                set(initialState);
            },

            // Legacy methods for backward compatibility
            postPayoutAccount: async (payload: any) => {
                return get().initiateInterBankPayout(payload);
            },
        }),
        { name: "payout-store" }
    )
);

export default usePayout;