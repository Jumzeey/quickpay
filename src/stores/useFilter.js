import { getCollectionHistory } from "@/services/collections";
import { getSubaccountHistory } from "@/services/sub-account";
import { getSettlementHistory } from "@/services/transaction";
import { formatDate } from '@/util/utils';
import { create } from "zustand";

const initialDateDate = {
    startDate: new Date(),
    endDate: new Date(),
    key: "selection",
}

const initialState = {
    selectionRange: initialDateDate,
    getCollectiontHistoryLoading: false,
    getSubaccountHistoryLoading: false,
    getSettlementsHistoryLoading: false,
    // initiateFilter: false,
    showFilter: false
};

const useFilter = create(
    (set, get) => ({
        ...initialState,
        toggleFilter: () => {
            const { showFilter } = get();
            set((state) => ({
                ...state,
                showFilter: !state.showFilter,
            }));
            return { showFilter };
        },
        handleDateChange: (ranges) => {
            // const { initiateFilter } = get();
            set((state) => ({
                ...state,
                selectionRange: ranges.selection,
            }));
            return { selectionRange: ranges.selection };
        },
        filterCollectionHistory: async () => {
            set((state) => ({
                ...state,
                getCollectiontHistoryLoading: true,
            }));
            try {
                const { selectionRange } = get();
                const params = { start_date: formatDate(selectionRange.startDate), end_date: formatDate(selectionRange.endDate) }
                const collections = await getCollectionHistory(params);
                set((state) => ({
                    ...state,
                    collections,
                }));
                return { collections };
            } finally {
                set((state) => ({
                    ...state,
                    getCollectiontHistoryLoading: false,
                    // initiateFilter: false
                }));
            }
        },
        filterSubaccountHistory: async () => {
            set((state) => ({
                ...state,
                getSubaccountHistoryLoading: true,
            }));
            try {
                const { selectionRange } = get();
                const params = { start_date: formatDate(selectionRange.startDate), end_date: formatDate(selectionRange.endDate) }
                const subaccounts = await getSubaccountHistory(params);
                set((state) => ({
                    ...state,
                    subaccounts,
                }));
                return { subaccounts };
            } finally {
                set((state) => ({
                    ...state,
                    getSubaccountHistoryLoading: false,
                    // initiateFilter: false
                }));
            }
        },
        filterSettlementsHistory: async () => {
            set((state) => ({
                ...state,
                getSettlementsHistoryLoading: true,
            }));
            try {
                const { selectionRange } = get();
                const params = { start_date: formatDate(selectionRange.startDate), end_date: formatDate(selectionRange.endDate) }
                const settlements = await getSettlementHistory(params);
                set((state) => ({
                    ...state,
                    settlements,
                }));
                return { settlements };
            } finally {
                set((state) => ({
                    ...state,
                    getSettlementsHistoryLoading: false,
                }));
            }
        },
        handleLoaderVisibility: (visibility) => {
            set((state) => ({
                ...state,
                getCollectiontHistoryLoading: visibility,
                getSubaccountHistoryLoading: visibility,
                getSettlementsHistoryLoading: visibility
            }));
        },
        handleReset: () => {
            set((state) => ({
                ...state,
                selectionRange: initialDateDate,
                showFilter: false,
                // initiateFilter: false
            }));
        },
    })
);


export default useFilter;


