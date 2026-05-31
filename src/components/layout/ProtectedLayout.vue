<script setup>
import { computed, onMounted, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import { useAuthStore } from '../../stores/auth.store';
import { useNotificationsStore } from '../../stores/notifications.store';

const authStore = useAuthStore();
const notificationsStore = useNotificationsStore();
const route = useRoute();
const router = useRouter();

onMounted(() => notificationsStore.fetchNotifications());
watch(() => route.path, () => notificationsStore.fetchNotifications());

const userInitials = computed(() => {
  const source =
    authStore.user?.displayName ||
    authStore.user?.userName ||
    authStore.user?.email ||
    'U';

  return source
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
});

const displayName = computed(
  () => authStore.user?.displayName || authStore.user?.userName || 'User',
);

const handleLogout = async () => {
  await authStore.logout();
  router.push({ name: 'login' });
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <!-- Sidebar desktop -->
    <aside class="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
      <div class="flex h-16 items-center border-b border-slate-200 px-6">
        <RouterLink
          :to="{ name: 'dashboard' }"
          class="text-lg font-semibold tracking-tight text-slate-950"
        >
          TaskFlow
        </RouterLink>
      </div>

      <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <!-- Dashboard -->
        <RouterLink :to="{ name: 'dashboard' }" class="nav-link">
          <svg class="mr-2.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Dashboard
        </RouterLink>

        <!-- Equipos -->
        <RouterLink :to="{ name: 'teams' }" class="nav-link">
          <svg class="mr-2.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Teams
        </RouterLink>

        <!-- Proyectos -->
        <RouterLink :to="{ name: 'projects' }" class="nav-link">
          <svg class="mr-2.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          Projects
        </RouterLink>

        <!-- Tareas -->
        <RouterLink :to="{ name: 'tasks' }" class="nav-link">
          <svg class="mr-2.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Tasks
        </RouterLink>

        <!-- Notificaciones -->
        <RouterLink :to="{ name: 'notifications' }" class="nav-link">
          <svg class="mr-2.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Notifications
          <span
            v-if="notificationsStore.unreadCount"
            class="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white"
          >
            {{ notificationsStore.unreadCount }}
          </span>
        </RouterLink>
      </nav>

      <!-- Perfil en el fondo del sidebar -->
      <div class="border-t border-slate-200 p-3">
        <RouterLink
          :to="{ name: 'profile' }"
          class="flex items-center gap-3 rounded-md px-3 py-2 transition hover:bg-slate-100"
          :class="{ 'bg-slate-950 text-white hover:bg-slate-950': $route.name === 'profile' }"
        >
          <div class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white">
            {{ userInitials }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-slate-950" :class="{ 'text-white': $route.name === 'profile' }">
              {{ displayName }}
            </p>
            <p class="truncate text-xs text-slate-500" :class="{ 'text-slate-300': $route.name === 'profile' }">
              {{ authStore.user?.role || 'user' }}
            </p>
          </div>
        </RouterLink>
      </div>
    </aside>

    <!-- Contenido principal -->
    <div class="lg:pl-64">
      <!-- Topbar -->
      <header class="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div class="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <!-- Logo mobile -->
          <RouterLink
            :to="{ name: 'dashboard' }"
            class="text-base font-semibold text-slate-950 lg:hidden"
          >
            TaskFlow
          </RouterLink>

          <!-- Nav mobile -->
          <nav class="flex items-center gap-1 overflow-x-auto lg:hidden">
            <RouterLink :to="{ name: 'dashboard' }" class="mobile-link shrink-0">Inicio</RouterLink>
            <RouterLink :to="{ name: 'teams' }" class="mobile-link shrink-0">Equipos</RouterLink>
            <RouterLink :to="{ name: 'projects' }" class="mobile-link shrink-0">Proyectos</RouterLink>
            <RouterLink :to="{ name: 'tasks' }" class="mobile-link shrink-0">Tareas</RouterLink>
            <RouterLink :to="{ name: 'notifications' }" class="mobile-link shrink-0">
              Avisos
              <span
                v-if="notificationsStore.unreadCount"
                class="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white"
              >
                {{ notificationsStore.unreadCount }}
              </span>
            </RouterLink>
          </nav>

          <!-- Usuario y logout -->
          <div class="ml-auto flex shrink-0 items-center gap-3">
            <RouterLink
              :to="{ name: 'profile' }"
              class="hidden min-w-0 text-right sm:block"
            >
              <p class="truncate text-sm font-medium text-slate-950 hover:underline">
                {{ displayName }}
              </p>
              <p class="truncate text-xs text-slate-500">
                {{ authStore.user?.role || 'user' }}
              </p>
            </RouterLink>

            <RouterLink :to="{ name: 'profile' }">
              <div class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-700">
                {{ userInitials }}
              </div>
            </RouterLink>

            <button
              type="button"
              class="secondary-button"
              @click="handleLogout"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main class="px-4 py-6 sm:px-6 lg:px-8">
        <router-view />
      </main>
    </div>
  </div>
</template>
