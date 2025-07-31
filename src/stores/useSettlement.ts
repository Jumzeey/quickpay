import {
    DownloadExportParams,
    SearchParams,
    Settlement,
    getDailyBreakdown,
    getSettlementDetails,
    getSettlementWindowTransactions,
    getSettlements
} from '@/services/settlement';
import { notifyError } from '@/util/utils';
import { create } from 'zustand';

interface SettlementState {
    settlements: Settlement[];
    selectedSettlement: Settlement | null;
    transactions: any[];
    dailyTransactions: any[];
    isDailyTransactionLoading: boolean;
    isTransactionLoading: boolean;
    isLoading: boolean;
    isLoadingDetails: boolean;
    pagination: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
    fetchSettlements: (params?: SearchParams | DownloadExportParams) => Promise<void>;
    fetchSettlementDetails: (params: { id: number; merchant_id: string }) => Promise<void>;
    fetchDailyBreakdown: (params: { batch: string; merchant_id: string; settlement_date: string }) => Promise<any>;
    fetchSettlementWindowTransactions: (params: SearchParams) => Promise<any>;
}

const initialState = {
    settlements: [],
    transactions: [],
    dailyTransactions: [],
    isDailyTransactionLoading: false,
    isTransactionLoading: false,
    selectedSettlement: null,
    isLoading: false,
    isLoadingDetails: false,
    pagination: {
        current_page: 1,
        per_page: 20,
        total: 0,
        last_page: 1,
    }
};

const useSettlement = create<SettlementState>((set) => ({
    ...initialState,

    fetchSettlements: async (params?: SearchParams | DownloadExportParams) => {
        set({ isLoading: true });
        try {
            const response = await getSettlements(params);
            set({
                settlements: response.data,
                pagination: response.pagination,
                isLoading: false
            });
        } catch (error: any) {
            notifyError(error.message);
            set({ isLoading: false });
        }
    },

    fetchSettlementDetails: async (params: { id: number; merchant_id: string }) => {
        if (!params.id) {
            throw new Error('Settlement ID is required');
        }

        set({ isLoadingDetails: true });
        try {
            const response = await getSettlementDetails(params.id, {
                merchant_id: params.merchant_id
            });
            set({
                selectedSettlement: response.data,
                isLoadingDetails: false
            });
        } catch (error: any) {
            notifyError(error.message);
            set({ isLoadingDetails: false });
        }
    },

    fetchDailyBreakdown: async (params: { batch: string; merchant_id: string; settlement_date: string }) => {
        if (!params.batch) {
            throw new Error('Batch is required');
        }
        if (!params.merchant_id) {
            throw new Error('Merchant ID is required');
        }
        if (!params.settlement_date) {
            throw new Error('Settlement date is required');
        }
        set({ isDailyTransactionLoading: true });

        try {
            const response = await getDailyBreakdown(params);
            set({
                dailyTransactions: response.data,
                // pagination: response.pagination,
                isDailyTransactionLoading: false
            });
        } catch (error: any) {
            set({ isDailyTransactionLoading: false });
            notifyError(error.message);
        }
    },

    fetchSettlementWindowTransactions: async (params: SearchParams) => {
        if (!params.id) {
            throw new Error('Settlement ID is required');
        }

        set({ isTransactionLoading: true });
        try {
            const {id, ...otherParams} = params;
            const response = await getSettlementWindowTransactions(id, otherParams);

            set({
                transactions: response.data,
                pagination: response.pagination,
                isTransactionLoading: false
            });
        } catch (error: any) {
            set({ isTransactionLoading: false });
            notifyError(error.message);
        }
    }
}));

export default useSettlement;