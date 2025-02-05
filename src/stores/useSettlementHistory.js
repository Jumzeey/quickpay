import { create } from "zustand";
import {
    getSettlementHistory
} from "@/services/transaction";
import moment from "moment";


const initialState = {
    getSettlementHistoryLoading: false,
    settlements: [],
    pagination: {
        "count": 0,
        "total": 0,
        "per_page": 0,
        "current_page": 1,
        "last_page": 1,
    },
    showFilter: false
};

const useSettlementHistory = create(
    (set, get) => ({
        ...initialState,
        fetchSettlementsHistory: async (searchParams) => {
            set((state) => ({
                ...state,
                getSettlementHistoryLoading: true
            }));
            try {
                let params = searchParams;
                const { settlements, pagination } = await getSettlementHistory(params) || {};
                set((state) => ({
                    ...state,
                    settlements,
                    pagination,
                }));
                return { settlements };
            } finally {
                set((state) => ({
                    ...state,
                    getSettlementHistoryLoading: false,
                }));
            }
        },
    }),
);


export default useSettlementHistory;