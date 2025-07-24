import {
    getSubaccountHistory,
    getSubaccountTransactions,
    postSubAccountAmount,
    updateSubAccountAmount,
} from "@/services/sub-account";
import { create } from "zustand";

interface SubAccountDocument {
    url: string;
    name: string;
}

interface SubAccount {
    id: number;
    merchant_name: string;
    email: string;
    mode: string;
    message: string;
    merchant_key: string;
    percentage: number;
    documents: SubAccountDocument[];
    created_at: string;
    description?: string;
    site_name?: string;
    website_url?: string;
    callback_url?: string;
    risk_rating?: string;
    category?: string;
}

interface Pagination {
    count: number;
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

interface DateRange {
    startDate: Date;
    endDate: Date;
    key: string;
}

interface SearchParams {
    page?: number;
    search?: string;
    start_date?: string;
    end_date?: string;
    [key: string]: any;
}

interface SubAccountPayload {
    id?: number;
    merchant_name?: string;
    email?: string;
    mode?: boolean;
    percentage?: string | number;
    description?: string;
    site_name?: string;
    website_url?: string;
    callback_url?: string;
    risk_rating?: string;
    category?: string;
    documents?: { name: string, url: string }[];
    [key: string]: any;
}

interface SubAccountState {
    getSubaccountHistoryLoading: boolean;
    getSubaccountTransactionsHistoryLoading: boolean;
    postSubAccountAmountLoading: boolean;
    updateSubAccountAmountLoading: boolean;
    deactivateSubAccountLoading: boolean;
    subaccounts: SubAccount[];
    subaccount_transactions?: any[];
    pagination: Pagination;
    selectionRange: DateRange;
    showFilter: boolean;
    message?: string;
}

// Helper function for formatting dates
const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
};

const initialDateDate: DateRange = {
    startDate: new Date(),
    endDate: new Date(),
    key: "selection",
};

const initialState: SubAccountState = {
    getSubaccountHistoryLoading: false,
    getSubaccountTransactionsHistoryLoading: false,
    postSubAccountAmountLoading: false,
    updateSubAccountAmountLoading: false,
    deactivateSubAccountLoading: false,
    subaccounts: [],
    pagination: {
        count: 0,
        total: 0,
        per_page: 0,
        current_page: 1,
        last_page: 1,
    },
    selectionRange: initialDateDate,
    showFilter: false
};

// Define the store with types
interface SubAccountStore extends SubAccountState {
    fetchSubaccountHistory: (searchParams?: SearchParams) => Promise<{ subaccounts: SubAccount[] }>;
    fetchSubaccountTransactionsHistory: (id: number, searchParams?: SearchParams) => Promise<{ subaccount_transactions: any[] }>;
    setSubAccountHistoryLoading: (value: boolean) => Promise<void>;
    postSubAccountAmount: (payload: SubAccountPayload) => Promise<{ message: string }>;
    updateSubAccountAmount: (payload: SubAccountPayload) => Promise<{ message: string }>;
}

const useSubAccount = create<SubAccountStore>(
    (set, get) => ({
        ...initialState,
        fetchSubaccountHistory: async (searchParams?: SearchParams) => {
            set((state) => ({
                ...state,
                getSubaccountHistoryLoading: true
            }));
            try {
                let params: SearchParams;
                if (searchParams) {
                    params = searchParams;
                } else {
                    const { selectionRange } = get();
                    params = {
                        start_date: formatDate(selectionRange.startDate),
                        end_date: formatDate(selectionRange.endDate),
                    };
                }
                const { subaccounts = [], pagination } = await getSubaccountHistory(params) || {};
                set((state) => ({
                    ...state,
                    subaccounts,
                    pagination: pagination || initialState.pagination,
                }));
                return { subaccounts };
            } finally {
                set((state) => ({
                    ...state,
                    getSubaccountHistoryLoading: false,
                }));
            }
        },
        fetchSubaccountTransactionsHistory: async (id: number, searchParams?: SearchParams) => {
            set((state) => ({
                ...state,
                getSubaccountTransactionsHistoryLoading: true
            }));
            try {
                const { subaccount_transactions = [], pagination } = await getSubaccountTransactions(id, searchParams) || {};
                set((state) => ({
                    ...state,
                    subaccount_transactions,
                    pagination: pagination || initialState.pagination,
                }));
                return { subaccount_transactions };
            } finally {
                set((state) => ({
                    ...state,
                    getSubaccountTransactionsHistoryLoading: false,
                }));
            }
        },
        setSubAccountHistoryLoading: async (value: boolean) => {
            set((state) => ({
                ...state,
                getSubAccountHistoryLoading: value
            }));
        },
        postSubAccountAmount: async (payload: SubAccountPayload) => {
            set((state) => ({
                ...state,
                postSubAccountAmountLoading: true
            }));
            try {
                // @ts-ignore
                const { message = '' } = await postSubAccountAmount(payload) || {};
                set((state) => ({
                    ...state,
                    message,
                }));
                return { message };
            } finally {
                set((state) => ({
                    ...state,
                    postSubAccountAmountLoading: false
                }));
            }
        },
        updateSubAccountAmount: async (payload: SubAccountPayload) => {
            set((state) => ({
                ...state,
                updateSubAccountAmountLoading: true
            }));
            try {
                // @ts-ignore
                const { data, message = '' } = await updateSubAccountAmount(payload) || {};
                set((state) => ({
                    ...state,
                    message,
                }));
                return {
                    message
                };
            } finally {
                set((state) => ({
                    ...state,
                    updateSubAccountAmountLoading: false
                }));
            }
        },
    }),
);

export default useSubAccount;