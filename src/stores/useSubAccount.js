import { create } from "zustand";
import {
    postSubAccountAmount,
    updateSubAccountAmount,
    getSubaccountHistory,
    getSubaccountTransactions,
} from "@/services/sub-account";
import moment from "moment";

const initialDateDate = {
    startDate: new Date(),
    endDate: new Date(),
    key: "selection",
}

const initialState = {
    getSubaccountHistoryLoading: false,
    getSubaccountTransactionsHistoryLoading: false,
    postSubAccountAmountLoading: false,
    updateSubAccountAmountLoading: false,
    deactivateSubAccountLoading: false,
    subaccounts: [],
    pagination: {
        "count": 0,
        "total": 0,
        "per_page": 0,
        "current_page": 1,
        "last_page": 1,
    },
    selectionRange: initialDateDate,
    showFilter: false
};

const useSubAccount = create(
    (set, get) => ({
        ...initialState,
        fetchSubaccountHistory: async (searchParams) => {
            set((state) => ({
                ...state,
                getSubaccountHistoryLoading: true
            }));
            try {
                let params;
                if (searchParams) {
                    params = searchParams;
                } else {
                    const { selectionRange } = get();
                    params = {
                        start_date: formatDate(selectionRange.startDate),
                        end_date: formatDate(selectionRange.endDate),
                    };
                }
                const { subaccounts, pagination } = await getSubaccountHistory(params) || {};
                set((state) => ({
                    ...state,
                    subaccounts,
                    pagination,
                }));
                return { subaccounts };
            } finally {
                set((state) => ({
                    ...state,
                    getSubaccountHistoryLoading: false,
                }));
            }
        },
        fetchSubaccountTransactionsHistory: async (id,searchParams) => {
            set((state) => ({
                ...state,
                getSubaccountTransactionsHistoryLoading: true
            }));
            try {
                let params = searchParams;
                const { subaccount_transactions, pagination } = await getSubaccountTransactions(id,params);
                set((state) => ({
                    ...state,
                    subaccount_transactions,
                    pagination,
                }));
                return { subaccount_transactions };
            } finally {
                set((state) => ({
                    ...state,
                    getSubaccountTransactionsHistoryLoading: false,
                }));
            }
        },
        setSubAccountHistoryLoading: async (value) => {
            set((state) => ({
                ...state,
                getSubAccountHistoryLoading: value
            }));
        },
        postSubAccountAmount: async (payload) => {
            set((state) => ({
                ...state,
                postSubAccountAmountLoading: true
            }));
            try {
                const { data, message } = await postSubAccountAmount(payload);
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
                    postSubAccountAmountLoading: false
                }));
            }
        },
        updateSubAccountAmount: async (payload) => {
            set((state) => ({
                ...state,
                updateSubAccountAmountLoading: true
            }));
            try {
                const { data, message } = await updateSubAccountAmount(payload);
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
                    message,
                }));
            }
        },
    }),
);


export default useSubAccount;