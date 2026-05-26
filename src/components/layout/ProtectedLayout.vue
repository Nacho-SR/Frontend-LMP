<script setup>
import { computed } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

import { useAuthStore } from '../../stores/auth.store';

const authStore = useAuthStore();
const router = useRouter();

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

const handleLogout = async () => {
  await authStore.logout();
  router.push({ name: 'login' });
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <aside class="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block">
      <div class="flex h-16 items-center border-b border-slate-200 px-6">
        <RouterLink
          :to="{ name: 'dashboard' }"
          class="text-lg font-semibold tracking-tight text-slate-950"
        >
          TaskFlow
        </RouterLink>
      </div>

      <nav class="space-y-1 px-3 py-4">
        <RouterLink
          :to="{ name: 'dashboard' }"
          class="nav-link"
        >
          Dashboard
        </RouterLink>

        <RouterLink
          :to="{ name: 'teams' }"
          class="nav-link"
        >
          Equipos
        </RouterLink>

        <span class="nav-link is-disabled">
          Proyectos
        </span>

        <span class="nav-link is-disabled">
          Tareas
        </span>
      </nav>
    </aside>

    <div class="lg:pl-64">
      <header class="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div class="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <RouterLink
            :to="{ name: 'dashboard' }"
            class="text-base font-semibold text-slate-950 lg:hidden"
          >
            TaskFlow
          </RouterLink>

          <nav class="flex items-center gap-2 lg:hidden">
            <RouterLink
              :to="{ name: 'dashboard' }"
              class="mobile-link"
            >
              Inicio
            </RouterLink>
            <RouterLink
              :to="{ name: 'teams' }"
              class="mobile-link"
            >
              Equipos
            </RouterLink>
          </nav>

          <div class="ml-auto flex min-w-0 items-center gap-3">
            <div class="hidden min-w-0 text-right sm:block">
              <p class="truncate text-sm font-medium text-slate-950">
                {{ authStore.user?.displayName || authStore.user?.userName || 'Usuario' }}
              </p>
              <p class="truncate text-xs text-slate-500">
                {{ authStore.user?.role || 'user' }}
              </p>
            </div>

            <div class="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              {{ userInitials }}
            </div>

            <button
              type="button"
              class="secondary-button"
              @click="handleLogout"
            >
              Salir
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
