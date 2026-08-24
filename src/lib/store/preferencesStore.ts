import { create } from "zustand";

interface PreferencesState {
  theme: "light" | "dark" | "system";
  soundEffects: boolean;
  reducedMotion: boolean;
  forbiddenModeUnlocked: boolean;
  setTheme: (theme: "light" | "dark" | "system") => void;
  toggleSoundEffects: () => void;
  toggleReducedMotion: () => void;
  unlockForbiddenMode: () => void;
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  theme: "light",
  soundEffects: true,
  reducedMotion: false,
  forbiddenModeUnlocked: false,
  setTheme: (theme) => set({ theme }),
  toggleSoundEffects: () => set((s) => ({ soundEffects: !s.soundEffects })),
  toggleReducedMotion: () => set((s) => ({ reducedMotion: !s.reducedMotion })),
  unlockForbiddenMode: () => set({ forbiddenModeUnlocked: true }),
}));
