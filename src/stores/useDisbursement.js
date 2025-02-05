import { create } from "zustand";
import {
    addDisbursement,
    verifyDisbursementOtp,
    viewDisbursement,
    getDisbursementHistory
} from "@/services/disbursement";

const initialState = {
    postDisbursementAmountLoading: false,
    verifyDisbursementOtp: false,
    viewDisbursementLoading: false,
    disbursements: [],
    pagination: {
        "count": 0,
        "total": 0,
        "per_page": 0,
        "current_page": 1,
        "last_page": 1,
    },
};

const useDisbursement = create(
    (set, get) => ({
        ...initialState,
        postDisbursementAccount: async (payload) => {
            set((state) => ({
                ...state,
            }));
            const { data, message } = await addDisbursement(payload);
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
        verifyDisbursementOtp: async (payload) => {
            set((state) => ({
                ...state,
                verifyDisbursementOtpLoading: true,
            }));
            const { data, message } = await verifyDisbursementOtp(payload);
            set((state) => ({
                ...state,
                message,
            }));
            return {
                message
            };
        },
        viewDisbursement: async (payload) => {
            set((state) => ({
                ...state,
                viewDisbursementLoading: true,
            }));
            const { data, message } = await viewDisbursement(payload);
            set((state) => ({
                ...state,
                disbursements_details: data.disbursement,
            }));
            return {
                disbursements_details: data.disbursement,
            };
        },
        fetchDisbursementHistory: async (searchParams) => {
            set((state) => ({
                ...state,
                getDisbursementHistoryLoading: true
            }));
            try {
                let params = searchParams;
                const { disbursements, pagination } = await getDisbursementHistory(params) || {};
                set((state) => ({
                    ...state,
                    disbursements,
                    pagination,
                }));
                return { disbursements };
            } finally {
                set((state) => ({
                    ...state,
                    getDisbursementHistoryLoading: false,
                }));
            }
        },
    }),
);


export default useDisbursement;