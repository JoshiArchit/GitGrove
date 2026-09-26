import { create } from "zustand";

type appViewStore = {
  showSettings: boolean;
  openSettings: () => void;
  closeSettings: () => void;
};

/**
 * Store for managing the general application view state.
 */
export const useAppViewStore = create<appViewStore>()((set) => ({
  showSettings: false,
  openSettings: () =>
    set({
      showSettings: true,
    }),
  closeSettings: () =>
    set({
      showSettings: false,
    }),
}));
