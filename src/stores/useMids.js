import { create } from "zustand";
import { getMids } from "@/services/settings"; // Ensure this function exists in services

const initialState = {
  mids: [],
  pagination: {
    count: 0,
    total: 0,
    per_page: 0,
    current_page: 1,
    last_page: 1,
  },
  getMidsLoading: false,
};

const useMids = create(set => ({
  ...initialState,
  fetchMids: async searchParams => {
    set(state => ({ ...state, getMidsLoading: true }));
    try {
      const { mids, pagination } = (await getMids(searchParams)) || {};
      set(state => ({ ...state, mids, pagination }));
    } finally {
      set(state => ({ ...state, getMidsLoading: false }));
    }
  },
}));

export default useMids;
