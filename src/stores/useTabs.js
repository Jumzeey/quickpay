import { create } from "zustand";
import { persist } from "zustand/middleware";

const initialState = {
    selectedTab: 1,
    rehydrated: false,
};

const useTabs = create(persist(
    (set) => ({
        ...initialState,
        handleTabClick: (tabId) => {
            set((state) => ({
                ...state,
                selectedTab: tabId,
            }));
        },
        setRehydrated: () => set({ rehydrated: true }),
    }),
    {
        name: "selectedTab",
        whitelist: ["selectedTab"],
        onRehydrateStorage: () => (state) => {
            state.setRehydrated();
        },
    }
));

export default useTabs;
