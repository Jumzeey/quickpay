import { create } from "zustand";
import {
    getUserLog
} from "@/services/settings";
import moment from "moment";

const initialState = {
    logs: [],
    pagination: {
        "count": 0,
        "total": 0,
        "per_page": 0,
        "current_page": 1,
        "last_page": 1,
    },
};

const useSetting = create(
    (set, get) => ({
        ...initialState,
        fetchUserLog: async (searchParams) => {
            set((state) => ({
                ...state,
                getUserLogLoading: true
            }));
            try {
                let params = searchParams;
                const { logs, pagination } = await getUserLog(params) || {};
                set((state) => ({
                    ...state,
                    logs,
                    pagination,
                }));
                return { logs };
            } finally {
                set((state) => ({
                    ...state,
                    getUserLogLoading: false,
                }));
            }
        },
    }),
);


export default useSetting;