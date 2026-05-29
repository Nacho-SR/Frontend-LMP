import { defineStore } from 'pinia';

import * as notificationsService from '../api/notifications.service';

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
        const response = await notificationsService.getNotificationsRequest();
        this.notifications = response.data || [];
      } finally {
        this.loading = false;
      }
    },
    async deleteNotification(notifId) {
      try {
        await notificationsService.deleteNotification(notifId);
        
        this.notifications = this.notifications.filter(n => n.id !== notifId);
      } catch (error) {
        console.error("Failed to delete:", error);
        throw error;
      }
    },
    async toggleReadNotification(notifId,routeToUse) {
      try {
        await notificationsService.toggleReadNotification(notifId,routeToUse);
        
      } catch (error) {
        console.error("Failed to update:", error);
        throw error;
      }
    },
  },
});
