import { defineStore } from 'pinia';

import {
  changePasswordRequest,
  loginRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
  registerRequest,
} from '../api/auth.service';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    accessToken: localStorage.getItem('accessToken') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    initialized: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
  },

  actions: {
    persistSession(data) {
      this.user = data.user || null;
      this.accessToken = data.accessToken || null;
      this.refreshToken = data.refreshToken || this.refreshToken;

      if (this.accessToken) {
        localStorage.setItem('accessToken', this.accessToken);
      }

      if (this.refreshToken) {
        localStorage.setItem('refreshToken', this.refreshToken);
      }
    },

    clearSession() {
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;

      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    },

    async initialize() {
      if (this.initialized) return;

      if (!this.accessToken) {
        this.initialized = true;
        return;
      }

      try {
        const response = await meRequest();
        this.user = response.data;
      } catch (error) {
        if (this.refreshToken) {
          try {
            const response = await refreshRequest(this.refreshToken);
            this.persistSession(response.data);
          } catch (refreshError) {
            this.clearSession();
          }
        } else {
          this.clearSession();
        }
      } finally {
        this.initialized = true;
      }
    },

    async login(credentials) {
      const response = await loginRequest(credentials);

      this.persistSession(response.data);
    },

    async register(payload) {
      const response = await registerRequest(payload);

      this.user = response.data;

      return response.data;
    },

    async logout() {
      try {
        if (this.accessToken) {
          await logoutRequest();
        }
      } finally {
        this.clearSession();
      }
    },

    async changePassword(payload) {
      await changePasswordRequest(payload);
    },
  },
});
