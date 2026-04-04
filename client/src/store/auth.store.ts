import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id:    string;
  name:  string;
  email: string;
  avatar?: string;
}

interface AuthState {
  user:         User | null;
  accessToken:  string | null;
  refreshToken: string | null;
  setAuth:      (user: User, accessToken: string, refreshToken: string) => void;
  setToken:     (accessToken: string) => void;
  logout:       () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:         null,
      accessToken:  null,
      refreshToken: null,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),

      setToken: (accessToken) =>
        set({ accessToken }),

      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'focusflow-auth' }
  )
);
