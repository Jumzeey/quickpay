import { create } from "zustand";
import {
    getCollectionHistory,
    getPaymentMandates,
    getVirtualAccounts
} from "@/services/collections";
import moment from "moment";

const initialState = {
    getCollectionHistoryLoading: false,
    getVirtualAccountsHistoryLoading: false,
    getPaymentMandateLoading: false,
    virtual_accounts: [],
    collections: [],
    pagination: {
        "count": 0,
        "total": 0,
        "per_page": 0,
        "current_page": 1,
        "last_page": 1,
    },
    showFilter: false
};

const useCollectionHistory = create(
    (set, get) => ({
        ...initialState,
        fetchCollectionHistory: async (searchParams) => {
            set((state) => ({
                ...state,
                getCollectionHistoryLoading: true
            }));
            try {
                let params = searchParams;
                if (searchParams.startDate && searchParams.endDate) {
                    params = {
                        ...params,
                        start_date: formatDate(searchParams.startDate),
                        end_date: formatDate(searchParams.endDate),
                    };
                }
                const { collections, pagination } = await getCollectionHistory(params) || {};
                set((state) => ({
                    ...state,
                    collections,
                    pagination,
                }));
                return { collections };
            } finally {
                set((state) => ({
                    ...state,
                    getCollectionHistoryLoading: false,
                }));
            }
        },
        fetchVirtualAccounts: async (searchParams) => {
            set((state) => ({
                ...state,
                getVirtualAccountsHistoryLoading: true
            }));
            try {
                let params = searchParams;
                if (searchParams?.startDate && searchParams?.endDate) {
                    params = {
                        ...params,
                        start_date: formatDate(searchParams.startDate),
                        end_date: formatDate(searchParams.endDate),
                    };
                }
                const { virtual_accounts, pagination } = await getVirtualAccounts(params) || {};
                set((state) => ({
                    ...state,
                    virtual_accounts,
                    pagination,
                }));
                return { virtual_accounts };
            } finally {
                set((state) => ({
                    ...state,
                    getVirtualAccountsHistoryLoading: false,
                }));
            }
        },
        fetchPaymentMandates: async (searchParams) => {
            set((state) => ({
                ...state,
                getPaymentMandateLoading: true
            }));
            try {
                let params = searchParams;
                if (searchParams.startDate && searchParams.endDate) {
                    params = {
                        ...params,
                        start_date: formatDate(searchParams.startDate),
                        end_date: formatDate(searchParams.endDate),
                    };
                }
                const { mandates, pagination } = await getPaymentMandates(params) || {};
                set((state) => ({
                    ...state,
                    mandates,
                    pagination,
                }));
                return { mandates };
            } finally {
                set((state) => ({
                    ...state,
                    getPaymentMandateLoading: false,
                }));
            }
        },
    }),
);


export default useCollectionHistory;