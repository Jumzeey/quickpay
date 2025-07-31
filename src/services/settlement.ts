import { CurrencyOption } from "@/stores/useCurrency";
import api from "@/util/api";
import { apiEndpoints } from "@/util/endpoints";

export type DownloadExportParams = {
    export: boolean
} & SearchParams

export interface Settlement {
    id: number;
    merchant_id: number;
    merchant_name: string;
    merchant_email: string;
    currency: string;
    batch: string;
    settlement_window_from: null;
    settlement_window_to: string;
    amount: string;
    transaction_count: number;
    status: string;
    metadata: string;
    meta: null;
    created_at: string;
    updated_at: string;
}

export interface DailyBreakdown {
    total_amount: number;
    transaction_count: number;
}

export interface SettlementMetadata {
    actions: Array<{
        action: string;
        details: {
            days_back?: number;
            created_by?: string;
            settlement_window_to?: string;
            settlement_window_from?: string | null;
            job_id?: number;
            merchant_id?: number;
            job_attempts?: number;
            total_amount?: number;
            daily_breakdown?: Record<string, DailyBreakdown>;
            transaction_count?: number;
        };
        timestamp: string;
        description?: string;
        batch_number?: string;
    }>;
}

export interface SettlementResponse {
    data: Settlement[];
    pagination: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
}

export interface SettlementWindowTransactionResponse {
    data: {
        id: number;
        amount: string;
        merchant_id: number;
        status: string;
        created_at: string;
        settlement_date: string;
        settlement_status: string;
        currency: string;
        merchant_meta: string;
        merchant_email: string;
    }[];
    pagination: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
}


export interface SettlementDetailsResponse {
    data: Settlement;
}

export interface SearchParams {
    page?: number;
    per_page?: number;
    status?: string;
    date_from?: string;
    date_to?: string;
    id?: string;
    merchant_id?: string;
    currency?: CurrencyOption;
    search?: string;
    export?: boolean
}

export const getSettlements = async (params?: SearchParams): Promise<SettlementResponse> => {
    try {
        const response = await api.get(apiEndpoints.settlements.LIST_SETTLEMENTS, { params });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getSettlementDetails = async (id: number, params?: SearchParams): Promise<SettlementDetailsResponse> => {
    try {
        const response = await api.get(
            apiEndpoints.settlements.GET_SETTLEMENT_DETAILS.replace(':id', String(id)),
            { params }
        );
        return response;
    } catch (error) {
        throw error;
    }
};

export const getDailyBreakdown = async (params: SearchParams) => {
    try {
        const response = await api.get(
            apiEndpoints.settlements.GET_DAILY_BREAKDOWN,
            { params }
        );
        return response;
    } catch (error) {
        throw error;
    }
};

export const getSettlementWindowTransactions = async (id: string, params: SearchParams): Promise<SettlementWindowTransactionResponse> => {
    try {
        const response = await api.get(
            apiEndpoints.settlements.GET_SETTLEMENT_WINDOW_TRANSACTIONS.replace(':id', id),
            { params }
        );
        return response.data;
    } catch (error) {
        throw error;
    }
};
