import { defineStore } from 'pinia';

import * as notificationsService from '../api/notifications.service';

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    notifications: [],
    loading: false,
  }),

  actions: {
    async fetchNotifications() {
      this.loading = true;

      try {
        const response = await notificationsService.getNotificationsRequest();
        this.notifications = response.data || [];
      } 
      catch (error) {
        console.error("Failed to get notifications: ", error);
        throw error;
      } 
      finally {
        this.loading = false;
      }
    },
    async fetchNotification(notificationId) {
      this.loading = true;
      try {
        const response = await notificationsService.getNotificationRequest(notificationId);
        const updatedNotif = response.data;

        if (updatedNotif) {
          const index = this.notifications.findIndex(n => n.id === notificationId);
          if (index !== -1) {
            this.notifications[index] = updatedNotif;
          } else {
            this.notifications.push(updatedNotif);
          }
        }
      } catch (error) {
        console.error(`Failed to fetch notification ${notificationId}:`, error);
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
        await this.fetchNotification(notifId);
      } catch (error) {
        console.error("Failed to update:", error);
        throw error;
      }
    },
  },
});
