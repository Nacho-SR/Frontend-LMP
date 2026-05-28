import { defineStore } from 'pinia';

import {
    getNotificationsRequest
} from '../api/notifications.service';

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    notifications: [],
    selectedTeam: null,
    members: [],
    loading: false,
    membersLoading: false,
  }),

  actions: {
    async fetchNotifications() {
      this.loading = true;

      try {
        const response = await getNotificationsRequest();
        this.notifications = response.data || [];
      } finally {
        this.loading = false;
      }
    },
  },
});
