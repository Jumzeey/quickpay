import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_URL =
  'https://api.sheety.co/3e4167ce45e60748b1aedfad4e047b74/mccListing2024October/cardAcceptorBusiness';

const useCategories = create(
  persist(
    (set, get) => ({
      categories: [
        'Technology',
        'Health',
        'Finance',
        'Education',
        'Food',
        'Clothing',
        'Transport',
        'Entertainment',
        'Other',
      ],
      fetchCategories: async () => {
        if (get().categories.length > 9) return; // Prevent refetch if categories are already loaded

        try {
          const response = await fetch(API_URL);
          const data = await response.json();

          const categorySet = new Set();

          data.cardAcceptorBusiness.forEach(item => {
            const name = item.tccName?.trim();
            if (
              name &&
              name.toLowerCase() !== 'this cell is intentionally left blank.' &&
              name.toLowerCase() !== 'r, t' &&
              name.toLowerCase() !== 'u'
            ) {
              categorySet.add(name);
            }
          });

          set(state => ({
            categories: [...state.categories, ...Array.from(categorySet)],
          }));
        } catch (error) {
          console.error('Error fetching categories:', error);
        }
      },
    }),
    { name: 'categories-storage' } // Persist data in localStorage
  )
);

export default useCategories;
