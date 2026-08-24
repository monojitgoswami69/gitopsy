import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { SubjectProfile } from "@/types/domain";

interface AuthState {
  token: string | null;
  username: string | null;
  avatarUrl: string | null;
  profile: SubjectProfile | null;
  isAuthenticated: boolean;
  isLoadingSession: boolean;
  authError: string | null;
  setToken: (token: string, username?: string, avatarUrl?: string) => void;
  setProfile: (profile: SubjectProfile | null) => void;
  fetchProfile: (force?: boolean) => Promise<SubjectProfile | null>;
  checkSession: () => Promise<string | null>;
  disconnect: () => Promise<void>;
  clearAuthError: () => void;
}

let inFlightSessionPromise: Promise<string | null> | null = null;
let inFlightProfilePromise: Promise<SubjectProfile | null> | null = null;

function safeSessionStorage(): Storage {
  if (typeof window !== "undefined") {
    try {
      return window.sessionStorage;
    } catch {
      // sessionStorage may be unavailable (private mode, sandbox)
    }
  }
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      username: null,
      avatarUrl: null,
      profile: null,
      isAuthenticated: false,
      isLoadingSession: false,
      authError: null,

      setToken: (token: string, username?: string, avatarUrl?: string) =>
        set({
          token,
          username: username || null,
          avatarUrl:
            avatarUrl || (username ? `https://github.com/${username}.png` : null),
          isAuthenticated: true,
          isLoadingSession: false,
          authError: null,
        }),

      setProfile: (profile) =>
        set({
          profile,
          username: profile?.login || get().username,
          avatarUrl: profile?.avatarUrl || get().avatarUrl,
        }),

      fetchProfile: async (force = false) => {
        const existing = get().profile;
        if (existing && !force) {
          if (!get().username && existing.login) {
            set({
              username: existing.login,
              avatarUrl: existing.avatarUrl || get().avatarUrl,
            });
          }
          return existing;
        }

        if (inFlightProfilePromise) {
          return inFlightProfilePromise;
        }

        inFlightProfilePromise = (async () => {
          try {
            const res = await fetch("/api/profile");
            if (res.ok) {
              const data = await res.json();
              if (data.profile) {
                set({
                  profile: data.profile,
                  username: data.profile.login,
                  avatarUrl: data.profile.avatarUrl,
                });
                return data.profile;
              }
            }
          } catch {
            // ignore fetch errors
          } finally {
            inFlightProfilePromise = null;
          }
          return null;
        })();

        return inFlightProfilePromise;
      },

      checkSession: async () => {
        if (inFlightSessionPromise) {
          return inFlightSessionPromise;
        }

        inFlightSessionPromise = (async () => {
          try {
            const res = await fetch("/api/auth/session");
            if (res.ok) {
              const data = await res.json();
              if (data.authenticated && data.token) {
                let currentProfile = get().profile;
                let userLogin = get().username || currentProfile?.login;
                let userAvatar = get().avatarUrl || currentProfile?.avatarUrl;

                set({
                  token: data.token,
                  username: userLogin || null,
                  avatarUrl:
                    userAvatar ||
                    (userLogin ? `https://github.com/${userLogin}.png` : null),
                  profile: currentProfile,
                  isAuthenticated: true,
                  isLoadingSession: false,
                  authError: null,
                });

                if (!currentProfile || !userLogin) {
                  get().fetchProfile();
                }

                return data.token;
              }
            }
          } catch {
            // Session fetch error
          } finally {
            inFlightSessionPromise = null;
          }

          set({
            token: null,
            username: null,
            isAuthenticated: false,
            isLoadingSession: false,
          });
          return null;
        })();

        return inFlightSessionPromise;
      },

      disconnect: async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch {
          // ignore
        }

        set({
          token: null,
          username: null,
          avatarUrl: null,
          profile: null,
          isAuthenticated: false,
          isLoadingSession: false,
          authError: null,
        });

        if (typeof window !== "undefined") {
          try {
            sessionStorage.removeItem("gitopsy_auth_storage");
            localStorage.removeItem("gitopsy_auth_storage");
          } catch {
            // storage may be unavailable
          }
        }
      },

      clearAuthError: () => set({ authError: null }),
    }),
    {
      name: "gitopsy_auth_storage",
      storage: createJSONStorage(() => safeSessionStorage()),
      partialize: (state) => ({
        username: state.username,
        avatarUrl: state.avatarUrl,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
