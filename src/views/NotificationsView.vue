<script setup>
import { onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';

import AlertMessage from '../components/ui/AlertMessage.vue';
import BaseButton from '../components/ui/BaseButton.vue';
import BaseInput from '../components/ui/BaseInput.vue';
import BaseTextarea from '../components/ui/BaseTextarea.vue';
import ConfirmDialog from '../components/ui/ConfirmDialog.vue';
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

const deleteConfirm = reactive({ open: false, notificationId: null, loading: false });

const formatTimestamp = (timestamp) => {  
  const date = new Date(timestamp._seconds * 1000);
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};
const openDelete = (notificationId) => {
  deleteConfirm.notificationId = notificationId;
  deleteConfirm.open = true;
};
const handleDeleteConfirm = async () => {
  try {
    deleteConfirm.loading = true;
    errorMessage.value = '';
    
    await notificationsStore.deleteNotification(deleteConfirm.notificationId);
    
    statusMessage.value = "Notification deleted successfully";
  } catch (error) {
    errorMessage.value = error.message || 'Notification couldn\'t be deleted';
  } finally {
    deleteConfirm.loading = false;
    deleteConfirm.open = false;
    deleteConfirm.notificationId = null;
  }
};
const handleToggleRead = async (notificationID, newStatus) => {

  try {
    isModifying.value = true;
    errorMessage.value = '';
    await notificationsStore.toggleReadNotification(notificationID,newStatus?'read':'unread');
    statusMessage.value = `Notification ${newStatus?'read':'unread'} successfully`;
  } catch (error) {
    errorMessage.value = error.message || `Notification couldn\'t be ${newStatus?'read':'unread'}`;
  } finally {
    isModifying.value = false;
  }
};

const handleReadAll = async () => {

  try {
    isModifying.value = true;
    errorMessage.value = '';
    await notificationsStore.readAllNotifications();
    statusMessage.value = `Notifications read successfully`;
  } catch (error) {
    errorMessage.value = error.message || `Notifications couldn\'t be read`;
  } finally {
    isModifying.value = false;
  }
};

onMounted(() => notificationsStore.fetchNotifications());

</script>

<template>
  <section class="space-y-6">
      <div class="flex items-end justify-between border-b border-gray-100 pb-4 mb-6">
        <div>
          <PageHeader title="Bandeja" subtitle="Notificaciones" class="m-0" />
        </div>
        
        <button @click="handleReadAll" class="rounded-lg px-5 py-2 text-b font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors border border-orange-200 shadow-sm">
          Read All
        </button>
    </div>
    <AlertMessage v-if="errorMessage" type="error" :message="errorMessage" />
    <AlertMessage v-if="statusMessage" type="success" :message="statusMessage" />
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
                  <span :class="notification.read ? 'text-slate-600' : 'text-slate-200'" class="text-xs whitespace-nowrap pt-0.5">
                    {{formatTimestamp(notification.createdAt) }} <span v-if="notification.read">🗸</span>
                  </span>

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
                <button @click="openDelete(notification.id)" 
                  :class="[
                    'rounded px-2 py-1 text-sm font-medium text-white transition-colors',
                    notification.read ? 'bg-orange-800 hover:bg-orange-900' : 'bg-red-600 hover:bg-red-700']">
                  Delete
                </button>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  <ConfirmDialog
      :open="deleteConfirm.open"
      title="Delete notification?"
      description="This is permanent and CANNOT be undone."
      confirm-label="Delete"
      confirm-variant="danger"
      :loading="deleteConfirm.loading"
      @confirm="handleDeleteConfirm"
      @cancel="deleteConfirm.open = false"
    />
  </section>
</template>
