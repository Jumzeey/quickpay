import {create} from "zustand";

const initialState = {
  loadingCount: 0,
};

const useNetworkLoaderStore = create((set, get) => ({
  ...initialState,
  increaseLoadingCount: () => {
    const state = get();
    set({
      loadingCount: state.loadingCount + 1,
    });
  },
  decreaseLoadingCount: () => {
    const state = get();
    set({
      loadingCount: state.loadingCount - 1,
    });
  },
}));

export default useNetworkLoaderStore;