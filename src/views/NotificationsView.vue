<script setup>
import { onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';

import AlertMessage from '../components/ui/AlertMessage.vue';
import BaseButton from '../components/ui/BaseButton.vue';
import BaseInput from '../components/ui/BaseInput.vue';
import BaseTextarea from '../components/ui/BaseTextarea.vue';
import EmptyState from '../components/ui/EmptyState.vue';
import LoadingState from '../components/ui/LoadingState.vue';
import PageHeader from '../components/ui/PageHeader.vue';
import StatusBadge from '../components/ui/StatusBadge.vue';
import { useNotificationsStore } from '../stores/notifications.store';

const notificationsStore = useNotificationsStore();


const isDeleting = ref(false); 
const isModifying = ref(false);
const statusMessage = ref('');
const errorMessage = ref('');


const mapError = (error, fallback) => {
  return error.response?.data?.message || fallback;
};

const handleDelete = async (notificationID) => {
  if (!confirm('Are you sure you want to delete this notification?')) return;

  try {
    isDeleting.value = true;
    errorMessage.value = '';
    
    await notificationsStore.deleteNotification(notificationID);
    
    statusMessage.value = "Notification deleted successfully";
  } catch (error) {
    errorMessage.value = mapError(error, 'Notification couldn\'t be deleted');
  } finally {
    isDeleting.value = false;
  }
};
const handleToggleRead = async (notificationID, newStatus) => {

  try {
    isModifying.value = true;
    errorMessage.value = '';
    await notificationsStore.toggleReadNotification(notificationID,newStatus?'read':'unread');
    await notificationsStore.fetchNotifications();
    statusMessage.value = `Notification ${newStatus?'read':'unread'} successfully`;
  } catch (error) {
    errorMessage.value = mapError(error, `Notification couldn\'t be ${newStatus?'read':'unread'}`);
  } finally {
    isModifying.value = false;
  }
};

onMounted(() => notificationsStore.fetchNotifications());
</script>

<template>
  <section class="space-y-6">
    <PageHeader title="Bandeja" subtitle="Notificaciones" />

    <div class="grid gap-6">
      <div>
        <LoadingState v-if="notificationsStore.loading" message="Cargando notificationes..." />

        <div
          v-else-if="!notificationsStore.notifications.length"
          class="rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <EmptyState title="Sin notificaciones" description="Aun no tienes notificaciones.">
            </EmptyState>
        </div>

        <div v-else class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div class="grid divide-y divide-slate-100"> <article
              v-for="notification in notificationsStore.notifications"
              :key="notification.id"
              class="flex flex-col justify-between p-5 transition-colors hover:bg-slate-50"
            >
              <div>
                <div class="flex items-start justify-between">
                  <h2 
                    :class="notification.read ? 'text-slate-400' : 'text-slate-950'"
                    class="truncate text-base font-semibold"
                  >
                    {{ notification.title }}
                  </h2>
                </div>
                <p 
                  :class="notification.read ? 'text-slate-400' : 'text-slate-600'"
                  class="mt-2 flex-1 text-sm"
                >
                  {{ notification.body || 'Sin descripción' }}
                </p>
              </div>
              
              <div class="gap-1 flex justify-end mt-4">
                <button 
                  @click="handleToggleRead(notification.id, !notification.read)"
                  :class="[
                    'rounded px-2 py-1 text-sm font-medium text-white transition-colors',
                    notification.read ? 'bg-gray-600 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700']">
                  {{ notification.read ? 'Mark as Unread' : 'Mark as Read' }}
                </button>
                <button @click="handleDelete(notification.id)" class="rounded bg-red-600 px-2 py-1 text-sm font-medium text-white hover:bg-red-700">
                  Delete
                </button>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
