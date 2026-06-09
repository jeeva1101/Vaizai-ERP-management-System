import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isRehydrating: true, // true until the initial refresh-token check completes
  activeBranchId: localStorage.getItem('activeBranchId') || null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setAccessToken: (accessToken) => set({ accessToken }),

  setActiveBranchId: (branchId) => {
    localStorage.setItem('activeBranchId', branchId);
    set({ activeBranchId: branchId });
  },

  login: (user, accessToken) => {
    const activeBranchId =
      user.activeBranch?._id ||
      user.activeBranch ||
      (user.branches && user.branches[0]?._id) ||
      (user.branches && user.branches[0]) ||
      null;
    if (activeBranchId) {
      localStorage.setItem('activeBranchId', activeBranchId);
    }
    localStorage.setItem('hasSession', 'true');
    set({
      user,
      accessToken,
      isAuthenticated: true,
      isRehydrating: false,
      activeBranchId: activeBranchId || null,
    });
  },

  logout: () => {
    fetch('/api/v1/auth/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('activeBranchId');
    localStorage.removeItem('hasSession');
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isRehydrating: false,
      activeBranchId: null,
    });
  },

  rehydrate: async () => {
    if (localStorage.getItem('hasSession') !== 'true') {
      set({ isRehydrating: false });
      return;
    }
    try {
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include', // send the HttpOnly refreshToken cookie
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Refresh failed');

      const json = await response.json();
      const { accessToken, data } = json;
      const user = data?.user;

      if (!accessToken || !user) throw new Error('Invalid refresh response');

      const activeBranchId =
        user.activeBranch?._id ||
        user.activeBranch ||
        (user.branches && user.branches[0]?._id) ||
        (user.branches && user.branches[0]) ||
        localStorage.getItem('activeBranchId') ||
        null;

      if (activeBranchId) {
        localStorage.setItem('activeBranchId', activeBranchId);
      }

      localStorage.setItem('hasSession', 'true');

      set({
        user,
        accessToken,
        isAuthenticated: true,
        isRehydrating: false,
        activeBranchId: activeBranchId || null,
      });
    } catch {
      // No valid session — clear any stale local data and show login
      localStorage.removeItem('activeBranchId');
      localStorage.removeItem('hasSession');
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isRehydrating: false,
        activeBranchId: null,
      });
    }
  },
}));
