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
const createError = ref('');
const joinError = ref('');


const mapError = (error, fallback) => {
  const code = error.response?.data?.error?.code;
  return JOIN_ERRORS[code] || error.response?.data?.message || fallback;
};




onMounted(() => notificationsStore.fetchNotifications());
</script>

<template>
  <section class="space-y-6">
    <PageHeader title="Bandeja" subtitle="Notificaciones" />

    <div class="grid gap-6 xl:grid-cols-[1fr_360px]">
      <!-- Lista de notificaciones -->
      <div>
        <LoadingState v-if="notificationsStore.loading" message="Cargando notificationes..." />

        <div
          v-else-if="!notificationsStore.notifications.length"
          class="rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <EmptyState
            title="Sin notificaciones"
            description="Aun no tienes notificaciones."
          >
            <template #icon>
              <svg class="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </template>
          </EmptyState>
        </div>

        <div v-else class="grid gap-4 md:grid-cols-2">
          <article
            v-for="notification in notificationsStore.notifications"
            :key="notification.id"
            class="flex flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <h2 class="truncate text-base font-semibold text-slate-950">
                {{ notification.title }}
              </h2>
            </div>

            <p class="mt-2 line-clamp-2 flex-1 text-sm text-slate-600">
              {{ notification.body|| 'Sin descripción' }}
            </p>

          </article>
        </div>
      </div>
    </div>
  </section>
</template>
