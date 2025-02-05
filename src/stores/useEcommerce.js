import { create } from "zustand";
import { getShippingOrders } from "@/services/e-commerce";

const initialState = {
    getShippingOrdersLoading: false,
    pagination: {
        "count": 0,
        "total": 0,
        "per_page": 0,
        "current_page": 1,
        "last_page": 1,
    },
    showFilter: false
};

const useEcommerce = create(
    (set, get) => ({
        ...initialState,
        fetchShippingOrders: async (searchParams) => {
            set((state) => ({
                ...state,
                getShippingOrdersLoading: true
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
                const { orders, pagination } = await getShippingOrders(params) || {};
                set((state) => ({
                    ...state,
                    orders,
                    pagination,
                }));
                return { orders };
            } finally {
                set((state) => ({
                    ...state,
                    getShippingOrdersLoading: false,
                }));
            }
        },
    }),
);


export default useEcommerce;