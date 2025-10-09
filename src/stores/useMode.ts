import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ModeState {
    isLiveMode: boolean;
    toggleMode: () => void;
    setMode: (isLive: boolean) => void;
}

const useMode = create<ModeState>()(
    persist(
        (set) => ({
            isLiveMode: true, // Default to live mode

            toggleMode: () => {
                set((state) => ({ isLiveMode: !state.isLiveMode }));
            },

            setMode: (isLive: boolean) => {
                set({ isLiveMode: isLive });
            },
        }),
        {
            name: 'mode-storage', // Name of the item in localStorage
        }
    )
);

export default useMode;
