<script setup>
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';

import AlertMessage from '../components/ui/AlertMessage.vue';
import LoadingState from '../components/ui/LoadingState.vue';

import { useAuthStore } from '../stores/auth.store';
import { getDashboardSummaryRequest } from '../api/dashboard.service';

const authStore = useAuthStore();

const loading = ref(true);
const pageError = ref('');
const summary = ref(null);

const PRIORITY_LABEL = { 1: 'Baja', 2: 'Media', 3: 'Alta', 4: 'Urgente' };
const PRIORITY_COLOR = {
  1: 'bg-green-50 text-green-700',
  2: 'bg-yellow-50 text-yellow-700',
  3: 'bg-orange-50 text-orange-700',
  4: 'bg-red-50 text-red-700',
};
const STATUS_LABEL = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  REVIEW: 'Revision',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};
const STATUS_COLOR = {
  PENDING: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  REVIEW: 'bg-amber-50 text-amber-700',
  COMPLETED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-red-50 text-red-600',
};
const PROJECT_STATUS_LABEL = { ACTIVE: 'Activo', ARCHIVED: 'Archivado', COMPLETED: 'Completado' };
const PROJECT_STATUS_COLOR = {
  ACTIVE: 'bg-blue-50 text-blue-700',
  ARCHIVED: 'bg-slate-100 text-slate-500',
  COMPLETED: 'bg-green-50 text-green-700',
};
const STATUS_ORDER = ['PENDING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED'];

const tasks = computed(() => summary.value?.tasks ?? null);
const projectSummaries = computed(() => summary.value?.projectSummaries ?? []);

const taskStatusEntries = computed(() => {
  if (!tasks.value?.byStatus) return [];
  return Object.entries(tasks.value.byStatus)
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => STATUS_ORDER.indexOf(a) - STATUS_ORDER.indexOf(b));
});

const taskPriorityEntries = computed(() => {
  if (!tasks.value?.byPriority) return [];
  return Object.entries(tasks.value.byPriority)
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => Number(b) - Number(a));
});

onMounted(async () => {
  try {
    const res = await getDashboardSummaryRequest();
    summary.value = res?.data ?? res;
  } catch {
    pageError.value = 'No se pudo cargar el resumen del dashboard';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight text-slate-950">
        Bienvenido, {{ authStore.user?.displayName || authStore.user?.userName || 'usuario' }}
      </h1>
      <p class="mt-1 text-sm font-medium text-slate-500">Dashboard</p>
    </div>

    <AlertMessage v-if="pageError" type="error" :message="pageError" />
    <LoadingState v-if="loading" message="Cargando resumen..." />

    <template v-else-if="summary">

      <!-- Accesos rapidos -->
      <div>
        <h2 class="mb-3 text-sm font-semibold text-slate-950">Accesos rapidos</h2>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <RouterLink
            :to="{ name: 'teams' }"
            class="flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
          >
            <svg class="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span class="text-xs font-medium text-slate-700">Equipos</span>
          </RouterLink>
          <RouterLink
            :to="{ name: 'projects' }"
            class="flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
          >
            <svg class="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span class="text-xs font-medium text-slate-700">Proyectos</span>
          </RouterLink>
          <RouterLink
            :to="{ name: 'tasks' }"
            class="flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
          >
            <svg class="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span class="text-xs font-medium text-slate-700">Tareas</span>
          </RouterLink>
          <RouterLink
            :to="{ name: 'notifications' }"
            class="flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
          >
            <svg class="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span class="text-xs font-medium text-slate-700">Notificaciones</span>
          </RouterLink>
        </div>
      </div>

      <!-- Tarjetas de resumen -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs font-medium uppercase tracking-wider text-slate-400">Equipos</p>
          <p class="mt-1 text-3xl font-bold text-slate-950">{{ summary.teams.total }}</p>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs font-medium uppercase tracking-wider text-slate-400">Proyectos activos</p>
          <p class="mt-1 text-3xl font-bold text-slate-950">{{ summary.projects.byStatus?.ACTIVE ?? 0 }}</p>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs font-medium uppercase tracking-wider text-slate-400">Tareas totales</p>
          <p class="mt-1 text-3xl font-bold text-slate-950">{{ tasks.total }}</p>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs font-medium uppercase tracking-wider text-slate-400">Asignadas a mi</p>
          <p class="mt-1 text-3xl font-bold text-indigo-600">{{ tasks.assignedToMe }}</p>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs font-medium uppercase tracking-wider text-slate-400">Vencidas</p>
          <p
            class="mt-1 text-3xl font-bold"
            :class="tasks.overdue > 0 ? 'text-red-600' : 'text-slate-950'"
          >
            {{ tasks.overdue }}
          </p>
        </div>
      </div>

      <!-- Tareas por estado y por prioridad -->
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="mb-3 text-sm font-semibold text-slate-950">Tareas por estado</h2>
          <div class="space-y-2">
            <div
              v-for="[status, count] in taskStatusEntries"
              :key="status"
              class="flex items-center justify-between"
            >
              <span
                class="rounded px-2 py-0.5 text-xs font-medium"
                :class="STATUS_COLOR[status] || 'bg-slate-100 text-slate-600'"
              >
                {{ STATUS_LABEL[status] || status }}
              </span>
              <span class="text-sm font-semibold text-slate-700">{{ count }}</span>
            </div>
            <p v-if="!taskStatusEntries.length" class="text-sm italic text-slate-400">Sin datos</p>
          </div>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="mb-3 text-sm font-semibold text-slate-950">Tareas por prioridad</h2>
          <div class="space-y-2">
            <div
              v-for="[priority, count] in taskPriorityEntries"
              :key="priority"
              class="flex items-center justify-between"
            >
              <span
                class="rounded px-2 py-0.5 text-xs font-medium"
                :class="PRIORITY_COLOR[Number(priority)] || 'bg-slate-100 text-slate-600'"
              >
                {{ PRIORITY_LABEL[Number(priority)] || `P${priority}` }}
              </span>
              <span class="text-sm font-semibold text-slate-700">{{ count }}</span>
            </div>
            <p v-if="!taskPriorityEntries.length" class="text-sm italic text-slate-400">Sin datos</p>
          </div>
        </div>
      </div>

      <!-- Resumen por proyecto -->
      <div class="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-100 px-5 py-4">
          <h2 class="text-sm font-semibold text-slate-950">Resumen por proyecto</h2>
        </div>
        <p v-if="!projectSummaries.length" class="px-5 py-6 text-sm italic text-slate-400">
          Sin proyectos.
        </p>
        <div v-else class="divide-y divide-slate-100">
          <div
            v-for="proj in projectSummaries"
            :key="proj.id"
            class="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-slate-950">{{ proj.name }}</p>
              <span
                class="mt-0.5 inline-block rounded px-1.5 py-0.5 text-xs font-medium"
                :class="PROJECT_STATUS_COLOR[proj.status] || 'bg-slate-100 text-slate-500'"
              >
                {{ PROJECT_STATUS_LABEL[proj.status] || proj.status }}
              </span>
            </div>
            <div class="flex shrink-0 flex-wrap gap-4 text-xs text-slate-500">
              <span>Total: <strong class="text-slate-800">{{ proj.taskSummary.total }}</strong></span>
              <span>Completadas: <strong class="text-green-700">{{ proj.taskSummary.completed }}</strong></span>
              <span v-if="proj.taskSummary.overdue > 0">
                Vencidas: <strong class="text-red-600">{{ proj.taskSummary.overdue }}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>


    </template>
  </section>
</template>
