import {
    addConversion,
    getConversionHistory,
    verifyConversionOtp,
    viewConversion
} from "@/services/conversions";
import { create } from "zustand";

const conversionData = [
    {
        id: 1,
        amount: '₦18,750.00',
        source_wallet: "Nigeria NGN",
        destination_wallet: "Kenyan Shilling",
        amount: '₦21,450.00 KES12,945.23',
        rate: 'KES 1.00 GCç 205.24',
        reference: 'TXN-2025-08FEB-111044-001',
        timestamp: 'Feb 8th, 2025 (11:10:44 AM)',
    },
    {
        id: 1,
        amount: '₦18,750.00',
        source_wallet: "Nigeria NGN",
        destination_wallet: "Kenyan Shilling",
        amount: '₦21,450.00 KES12,945.23',
        rate: 'KES 1.00 GCç 205.24',
        reference: 'TXN-2025-08FEB-111044-001',
        timestamp: 'Feb 8th, 2025 (11:10:44 AM)',
    },
    {
        id: 1,
        amount: '₦18,750.00',
        source_wallet: "Nigeria NGN",
        destination_wallet: "Kenyan Shilling",
        amount: '₦21,450.00 KES12,945.23',
        rate: 'KES 1.00 GCç 205.24',
        reference: 'TXN-2025-08FEB-111044-001',
        timestamp: 'Feb 8th, 2025 (11:10:44 AM)',
    },
    {
        id: 1,
        amount: '₦18,750.00',
        source_wallet: "Nigeria NGN",
        destination_wallet: "Kenyan Shilling",
        amount: '₦21,450.00 KES12,945.23',
        rate: 'KES 1.00 GCç 205.24',
        reference: 'TXN-2025-08FEB-111044-001',
        timestamp: 'Feb 8th, 2025 (11:10:44 AM)',
    },
    {
        id: 1,
        amount: '₦18,750.00',
        source_wallet: "Nigeria NGN",
        destination_wallet: "Kenyan Shilling",
        amount: '₦21,450.00 KES12,945.23',
        rate: 'KES 1.00 GCç 205.24',
        reference: 'TXN-2025-08FEB-111044-001',
        timestamp: 'Feb 8th, 2025 (11:10:44 AM)',
    },
];

const initialState = {
    postConversionamountLoading: false,
    verifyConversionOtp: false,
    viewConversionLoading: false,
    conversions: conversionData,
    pagination: {
        "count": 0,
        "total": 0,
        "per_page": 0,
        "current_page": 1,
        "last_page": 1,
    },
};

const useConversion = create(
    (set, get) => ({
        ...initialState,
        postConversionAccount: async (payload) => {
            set((state) => ({
                ...state,
            }));
            const { data, message } = await addConversion(payload);
            set((state) => ({
                ...state,
                disburse: data,
                disburse_payload: payload
            }));
            return {
                message,
                disburse: data,
                disburse_payload: payload,
            };
        },
        fetchConversionHistory: async (searchParams) => {
            set((state) => ({
                ...state,
                getConversionHistoryLoading: true
            }));
            try {
                let params = searchParams;
                const { conversions, pagination } = await getConversionHistory(params) || {};
                set((state) => ({
                    ...state,
                    conversions,
                    pagination,
                }));
                return { conversions };
            } finally {
                set((state) => ({
                    ...state,
                    getConversionHistoryLoading: false,
                }));
            }
        },
    }),
);


export default useConversion;