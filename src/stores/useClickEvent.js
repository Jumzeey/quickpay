import { create } from "zustand";
import { persist } from "zustand/middleware";

const initialState = {
    isVisible: false,
    selectedItem: null,
    rehydrated: false,
};

const useClickEvent = create(persist(
    (set, get) => ({
        ...initialState,
        handleClick: (item) => {
            set((state) => ({
                ...state,
                selectedItem: item,
            }));
        },
        handleToggle: () => {
            set((state) => ({
                ...state,
                isVisible: !state.isVisible,
            }));
        },
        setRehydrated: () => set({ rehydrated: true }),
    }),
    {
        name: "selectedItem",
        whitelist: ["selectedItem", "isVisible"],
        onRehydrateStorage: () => (state) => {
            state.setRehydrated();
        },
    }
));

export default useClickEvent;
