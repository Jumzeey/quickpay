import { create } from "zustand";
import { getCategories } from "@/services/settings"; // Ensure this function exists

const initialState = {
  categories: [],
  getCategoriesLoading: false,
};

const useCategories = create((set) => ({
  ...initialState,
  fetchCategories: async () => {
    set({ getCategoriesLoading: true });
    try {
      const categories = (await getCategories()) || [];
      set({ categories });
    } finally {
      set({ getCategoriesLoading: false });
    }
  },
}));

export default useCategories;