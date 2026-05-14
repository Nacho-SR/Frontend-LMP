import { defineStore } from 'pinia';

import { loginRequest } from '../api/auth.service';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    async login(credentials) {
      const response = await loginRequest(credentials);

      this.user = response.data.user;

      this.token = response.data.token;

      localStorage.setItem(
        'token',
        response.data.token
      );
    },

    logout() {
      this.user = null;

      this.token = null;

      localStorage.removeItem('token');
    },
  },
});