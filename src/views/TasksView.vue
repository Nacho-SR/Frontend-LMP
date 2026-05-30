<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';

import AlertMessage from '../components/ui/AlertMessage.vue';
import BaseButton from '../components/ui/BaseButton.vue';
import BaseInput from '../components/ui/BaseInput.vue';
import BaseSelect from '../components/ui/BaseSelect.vue';
import BaseTextarea from '../components/ui/BaseTextarea.vue';
import ConfirmDialog from '../components/ui/ConfirmDialog.vue';
import EmptyState from '../components/ui/EmptyState.vue';
import LoadingState from '../components/ui/LoadingState.vue';
import PageHeader from '../components/ui/PageHeader.vue';
import PriorityBadge from '../components/ui/PriorityBadge.vue';
import StatusBadge from '../components/ui/StatusBadge.vue';
import { useAuthStore } from '../stores/auth.store';
import { useProjectsStore } from '../stores/projects.store';
import { useTasksStore } from '../stores/tasks.store';
import { useTeamsStore } from '../stores/teams.store';
import { fetchUserList } from '../api/users.service';

const tasksStore = useTasksStore();
const teamsStore = useTeamsStore();
const authStore = useAuthStore();
const projectsStore = useProjectsStore();

const listError = ref('');
const createError = ref('');
const createSuccess = ref('');
const creating = ref(false);
const advancingId = ref(null);
const claimingId = ref(null);
const rejectingId = ref(null);
const statusFilter = ref('ALL');
const teamFilter = ref('');
const allUsers = ref([]);

const deleteConfirm = reactive({ open: false, taskId: null, loading: false });

const createForm = reactive({
  name: '',
  teamId: '',
  projectId: '',
  priority: '2',
  description: '',
  dueDate: '',
  maxWorkers: '',
});

const STATUS_TABS = [
  { value: 'ALL', label: 'Todas' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'REVIEW', label: 'En revisión' },
  { value: 'COMPLETED', label: 'Completada' },
  { value: 'CANCELLED', label: 'Cancelada' },
];

const PRIORITY_OPTIONS = [
  { value: '1', label: 'Baja' },
  { value: '2', label: 'Media' },
  { value: '3', label: 'Alta' },
  { value: '4', label: 'Urgente' },
];

const teamOptions = computed(() =>
  teamsStore.teams.map((t) => ({ value: t.id, label: t.name })),
);

const projectOptions = computed(() => {
  if (!createForm.teamId) return [];
  return projectsStore.projects
    .filter((p) => p.teamId === createForm.teamId && p.status !== 'DELETED')
    .map((p) => ({ value: p.id, label: p.name }));
});

const filteredTasks = computed(() =>
  statusFilter.value === 'ALL'
    ? tasksStore.tasks
    : tasksStore.tasks.filter((t) => t.status === statusFilter.value),
);

const taskCount = (status) =>
  status === 'ALL'
    ? tasksStore.tasks.length
    : tasksStore.tasks.filter((t) => t.status === status).length;

const teamName = (id) => teamsStore.teams.find((t) => t.id === id)?.name ?? '—';
const projectName = (id) => projectsStore.projects.find((p) => p.id === id)?.name ?? '—';

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const isOverdue = (dateStr, status) => {
  if (!dateStr || status === 'COMPLETED' || status === 'CANCELLED') return false;
  return new Date(dateStr) < new Date();
};

const isMyTask = (task) =>
  task.assignedUserIds?.includes(authStore.user?.id);

const isWorker = (task) =>
  task.workerIds?.includes(authStore.user?.id);

const isUnassigned = (task) =>
  !task.assignedUserIds || task.assignedUserIds.length === 0;

const userName = (userId) => {
  const u = allUsers.value.find((u) => u.id === userId);
  return u?.displayName || u?.userName || userId;
};

const assignedNames = (task) =>
  (task.assignedUserIds || []).map(userName);

const getMaxWorkers = (task) => {
  const tag = (task.tags || []).find((t) => t.startsWith('maxWorkers:'));
  if (!tag) return null;
  const n = parseInt(tag.split(':')[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const isFull = (task) => {
  const max = getMaxWorkers(task);
  if (!max) return false;
  return (task.assignedUserIds || []).length >= max;
};

watch(
  () => createForm.teamId,
  () => { createForm.projectId = ''; },
);

watch(
  () => createForm.teamId,
  async (teamId) => {
    if (!teamId) return;
    const hasProjects = projectsStore.projects.some((p) => p.teamId === teamId);
    if (!hasProjects) {
      try { await projectsStore.fetchProjects(); } catch { /* ignore */ }
    }
  },
);

watch(teamFilter, async (teamId) => {
  if (!teamId) return;
  listError.value = '';
  try {
    await tasksStore.fetchTeamTasks(teamId);
  } catch {
    listError.value = 'No se pudieron cargar las tareas del equipo';
  }
});

const ERRORS = {
  UNAUTHORIZED_TEAM_ACCESS: 'No tienes acceso a este equipo',
  PROJECT_NOT_FOUND: 'El proyecto no existe',
  PROJECT_TEAM_MISMATCH: 'El proyecto no pertenece a este equipo',
};

const mapError = (error, fallback) => {
  const code = error.response?.data?.error?.code;
  return ERRORS[code] || error.response?.data?.message || fallback;
};

const handleCreate = async () => {
  try {
    creating.value = true;
    createError.value = '';
    createSuccess.value = '';

    const tags = [];
    const max = parseInt(createForm.maxWorkers);
    if (Number.isFinite(max) && max > 0) tags.push(`maxWorkers:${max}`);

    const payload = {
      name: createForm.name,
      teamId: createForm.teamId,
      projectId: createForm.projectId,
      priority: Number(createForm.priority),
      description: createForm.description,
      assignedUserIds: [],
      tags,
    };
    if (createForm.dueDate) {
      payload.dueDate = new Date(createForm.dueDate).toISOString();
    }

    await tasksStore.createTask(payload);
    createSuccess.value = 'Tarea creada correctamente';
    createForm.name = '';
    createForm.description = '';
    createForm.dueDate = '';
    createForm.priority = '2';
    createForm.maxWorkers = '';
  } catch (error) {
    createError.value = mapError(error, 'No se pudo crear la tarea');
  } finally {
    creating.value = false;
  }
};

const handleAdvance = async (task) => {
  try {
    advancingId.value = task.id;
    await tasksStore.advanceStatus(task.id);
  } catch {
    // status stays unchanged
  } finally {
    advancingId.value = null;
  }
};

const handleComplete = async (task) => {
  try {
    advancingId.value = task.id;
    await tasksStore.completeReview(task.id);
  } catch {
    // ignore
  } finally {
    advancingId.value = null;
  }
};

const handleJoin = async (task) => {
  try {
    claimingId.value = task.id;
    await tasksStore.joinTask(task.id, authStore.user?.id);
  } catch {
    // ignore
  } finally {
    claimingId.value = null;
  }
};

const handleClaimReview = async (task) => {
  try {
    claimingId.value = task.id;
    await tasksStore.claimTask(task.id, authStore.user?.id);
  } catch {
    // ignore
  } finally {
    claimingId.value = null;
  }
};

const handleReject = async (task) => {
  try {
    rejectingId.value = task.id;
    await tasksStore.rejectReview(task.id);
  } catch {
    // ignore
  } finally {
    rejectingId.value = null;
  }
};

const openDelete = (taskId) => {
  deleteConfirm.taskId = taskId;
  deleteConfirm.open = true;
};

const handleDeleteConfirm = async () => {
  try {
    deleteConfirm.loading = true;
    await tasksStore.deleteTask(deleteConfirm.taskId);
  } catch {
    // ignore
  } finally {
    deleteConfirm.loading = false;
    deleteConfirm.open = false;
    deleteConfirm.taskId = null;
  }
};

onMounted(async () => {
  await teamsStore.fetchTeams();
  if (teamOptions.value.length) {
    createForm.teamId = teamOptions.value[0].value;
    teamFilter.value = teamOptions.value[0].value;
  }

  try {
    await projectsStore.fetchProjects();
    if (projectOptions.value.length) createForm.projectId = projectOptions.value[0].value;
  } catch { /* ignore */ }

  try {
    const result = await fetchUserList();
    allUsers.value = result.data || [];
  } catch { /* ignore */ }
});
</script>

<template>
  <section class="space-y-6">
    <PageHeader title="Tareas" subtitle="Mis tareas asignadas" />

    <div class="grid gap-6 xl:grid-cols-[1fr_360px]">
      <!-- Lista de tareas -->
      <div class="space-y-4">
        <!-- Selector de equipo -->
        <div class="flex items-center gap-3">
          <label class="text-sm font-medium text-slate-700">Equipo:</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="team in teamsStore.teams"
              :key="team.id"
              type="button"
              :class="[
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                teamFilter === team.id
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700',
              ]"
              @click="teamFilter = team.id"
            >
              {{ team.name }}
            </button>
          </div>
        </div>

        <!-- Filtros por estatus -->
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tab in STATUS_TABS"
            :key="tab.value"
            type="button"
            :class="[
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              statusFilter === tab.value
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700',
            ]"
            @click="statusFilter = tab.value"
          >
            {{ tab.label }}
            <span
              v-if="taskCount(tab.value) > 0"
              :class="[
                'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                statusFilter === tab.value
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-slate-100 text-slate-500',
              ]"
            >
              {{ taskCount(tab.value) }}
            </span>
          </button>
        </div>

        <AlertMessage v-if="listError" type="error" :message="listError" />
        <LoadingState v-if="tasksStore.loading" message="Cargando tareas..." />

        <div
          v-else-if="!filteredTasks.length"
          class="rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <EmptyState
            title="Sin tareas"
            :description="
              statusFilter === 'ALL'
                ? 'Crea tu primera tarea desde el formulario.'
                : 'No hay tareas con este estado.'
            "
          >
            <template #icon>
              <svg
                class="h-6 w-6 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </template>
          </EmptyState>
        </div>

        <ul v-else class="space-y-3">
          <li
            v-for="task in filteredTasks"
            :key="task.id"
            class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-slate-950">
                  
                  <RouterLink
                    :to="{ name: 'task-detail', params: { taskId: task.id } }"
                    class="truncate text-sm font-semibold text-slate-950 text-white-800 hover:text-gray-900"
                    >
                    {{ task.name }}
                  </RouterLink>
                  
                </p>
                <p class="mt-0.5 text-xs text-slate-400">
                  {{ teamName(task.teamId) }} · {{ projectName(task.projectId) }}
                  <template v-if="getMaxWorkers(task)">
                    ·
                    <span :class="isFull(task) ? 'font-medium text-rose-500' : 'text-slate-400'">
                      {{ (task.assignedUserIds || []).length }}/{{ getMaxWorkers(task) }} trabajadores
                    </span>
                  </template>
                </p>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <PriorityBadge :priority="task.priority" />
                <StatusBadge :status="task.status" />
              </div>
            </div>

            <p v-if="task.description" class="mt-2 line-clamp-2 text-xs text-slate-500">
              
              {{ task.description }}
            </p>

            <p
              v-if="task.dueDate"
              :class="[
                'mt-2 text-xs font-medium',
                isOverdue(task.dueDate, task.status) ? 'text-red-600' : 'text-slate-400',
              ]"
            >
              Vence: {{ formatDate(task.dueDate) }}
              <span v-if="isOverdue(task.dueDate, task.status)"> · Vencida</span>
            </p>

            <div class="mt-3 border-t border-slate-100 pt-3">
              <!-- Asignados / Contribuidores -->
              <div class="mb-2 space-y-1">
                <div class="flex flex-wrap items-center gap-1">
                  <span class="text-xs text-slate-400">
                    {{ task.status === 'COMPLETED' ? 'Completado por:' : 'Asignado a:' }}
                  </span>
                  <template v-if="isUnassigned(task)">
                    <span class="text-xs text-slate-400">Nadie</span>
                  </template>
                  <template v-else>
                    <span
                      v-for="name in assignedNames(task)"
                      :key="name"
                      :class="[
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        isMyTask(task) ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600',
                      ]"
                    >
                      {{ name }}
                    </span>
                  </template>
                </div>
                <!-- Trabajadores previos (visible en REVIEW y COMPLETED) -->
                <div
                  v-if="task.workerIds?.length && ['REVIEW', 'COMPLETED'].includes(task.status)"
                  class="flex flex-wrap items-center gap-1"
                >
                  <span class="text-xs text-slate-400">Trabajado por:</span>
                  <span
                    v-for="name in (task.workerIds || []).map(userName)"
                    :key="name"
                    class="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                  >
                    {{ name }}
                  </span>
                </div>
              </div>

              <!-- Acciones -->
              <div class="flex items-center justify-end gap-2">
                <!-- Unirse a tarea pendiente o en progreso (si hay cupo) -->
                <BaseButton
                  v-if="!isMyTask(task) && ['PENDING', 'IN_PROGRESS'].includes(task.status) && !isFull(task)"
                  variant="secondary"
                  size="sm"
                  :loading="claimingId === task.id"
                  @click="handleJoin(task)"
                >
                  Asignarme
                </BaseButton>

                <!-- Avanzar estado: Iniciar / Revisar (solo el asignado, no en REVIEW) -->
                <BaseButton
                  v-if="isMyTask(task) && ['PENDING', 'IN_PROGRESS'].includes(task.status)"
                  variant="secondary"
                  size="sm"
                  :loading="advancingId === task.id"
                  @click="handleAdvance(task)"
                >
                  {{ task.status === 'PENDING' ? 'Iniciar' : 'Enviar a revisión' }}
                </BaseButton>

                <!-- Tomar revisión: solo usuarios que NO trabajaron en la tarea -->
                <BaseButton
                  v-if="task.status === 'REVIEW' && !isMyTask(task) && !isWorker(task)"
                  variant="secondary"
                  size="sm"
                  :loading="claimingId === task.id"
                  @click="handleClaimReview(task)"
                >
                  Asignar revisión
                </BaseButton>

                <!-- Acciones del revisor asignado -->
                <template v-if="isMyTask(task) && task.status === 'REVIEW'">
                  <BaseButton
                    variant="secondary"
                    size="sm"
                    :loading="rejectingId === task.id"
                    @click="handleReject(task)"
                  >
                    Regresar a progreso
                  </BaseButton>
                  <BaseButton
                    variant="primary"
                    size="sm"
                    :loading="advancingId === task.id"
                    @click="handleComplete(task)"
                  >
                    Completar
                  </BaseButton>
                </template>

                <button
                  type="button"
                  class="danger-button h-8 px-3 text-xs"
                  @click="openDelete(task.id)"
                >
                  Eliminar
                </button>
                
              </div>
            </div>
          </li>
        </ul>
      </div>

      <!-- Crear tarea -->
      <aside>
        <form
          class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          @submit.prevent="handleCreate"
        >
          <h2 class="text-base font-semibold text-slate-950">Crear tarea</h2>

          <div class="mt-4 space-y-2">
            <BaseInput id="task-name" v-model="createForm.name" label="Nombre" required />
            <BaseSelect
              id="task-team"
              v-model="createForm.teamId"
              label="Equipo"
              :options="teamOptions"
              :disabled="!teamOptions.length"
            />
            <BaseSelect
              id="task-project"
              v-model="createForm.projectId"
              label="Proyecto"
              :options="projectOptions"
              :disabled="!projectOptions.length"
            />
            <BaseSelect
              id="task-priority"
              v-model="createForm.priority"
              label="Prioridad"
              :options="PRIORITY_OPTIONS"
            />
            <BaseInput
              id="task-due"
              v-model="createForm.dueDate"
              label="Fecha límite"
              type="date"
            />
            <BaseInput
              id="task-max-workers"
              v-model="createForm.maxWorkers"
              label="Máx. trabajadores"
              type="number"
              min="1"
              max="20"
              placeholder="Sin límite"
            />
            <BaseTextarea
              id="task-desc"
              v-model="createForm.description"
              label="Descripción"
              :rows="3"
            />
          </div>

          <p v-if="!teamOptions.length" class="mt-2 text-xs text-slate-400">
            Debes pertenecer a un equipo para crear tareas.
          </p>
          <p v-else-if="!projectOptions.length && createForm.teamId" class="mt-2 text-xs text-slate-400">
            El equipo seleccionado no tiene proyectos activos.
          </p>

          <AlertMessage v-if="createError" type="error" :message="createError" class="mt-3" />
          <AlertMessage v-if="createSuccess" type="success" :message="createSuccess" class="mt-3" />

          <BaseButton
            type="submit"
            :loading="creating"
            :disabled="!createForm.teamId || !createForm.projectId"
            class="mt-4 w-full"
          >
            Crear tarea
          </BaseButton>
        </form>
      </aside>
    </div>

    <ConfirmDialog
      :open="deleteConfirm.open"
      title="¿Eliminar tarea?"
      description="Esta acción eliminará la tarea permanentemente. No se puede deshacer."
      confirm-label="Eliminar"
      confirm-variant="danger"
      :loading="deleteConfirm.loading"
      @confirm="handleDeleteConfirm"
      @cancel="deleteConfirm.open = false"
    />
  </section>
</template>
