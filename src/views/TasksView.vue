<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

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
import { useChartsStore } from '../stores/charts.store';
import { useProjectsStore } from '../stores/projects.store';
import { useTasksStore } from '../stores/tasks.store';
import { useTeamsStore } from '../stores/teams.store';
import { getStagesByChartRequest, moveTaskRequest, updateStageRequest } from '../api/stages.service';
import { fetchUserList } from '../api/users.service';

const tasksStore = useTasksStore();
const teamsStore = useTeamsStore();
const authStore = useAuthStore();
const projectsStore = useProjectsStore();
const chartsStore = useChartsStore();

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

// Enviar al tablero
const boardPickerOpen = ref(null);   // taskId cuyo picker está abierto
const sendingToBoardId = ref(null);  // taskId que se está enviando

// Editar tarea
const editingTask = ref(null);
const editForm = reactive({ name: '', priority: '2', description: '', dueDate: '', maxWorkers: '' });
const savingEdit = ref(false);
const editError = ref('');

const deleteConfirm = reactive({ open: false, taskId: null, loading: false });

const createForm = reactive({
  name: '',
  teamId: '',
  projectId: '',
  chartId: '',
  priority: '2',
  description: '',
  dueDate: '',
  maxWorkers: '',
});

const selectedChartStages = ref([]);
const loadingChartStages = ref(false);

const STATUS_TABS = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'REVIEW', label: 'In review' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Canceled' },
];

const PRIORITY_OPTIONS = [
  { value: '1', label: 'Low' },
  { value: '2', label: 'Medium' },
  { value: '3', label: 'High' },
  { value: '4', label: 'Urgent' },
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

const chartOptions = computed(() => {
  if (!createForm.teamId) return [];
  return chartsStore.charts
    .filter((c) => c.teamId === createForm.teamId)
    .map((c) => ({ value: c.id, label: c.name }));
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
  return new Date(dateStr).toLocaleDateString({
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
  async (teamId) => {
    createForm.projectId = '';
    createForm.chartId = '';
    selectedChartStages.value = [];
    if (!teamId) return;
    const hasProjects = projectsStore.projects.some((p) => p.teamId === teamId);
    if (!hasProjects) {
      try { await projectsStore.fetchProjects(); } catch {}
    }
  },
);

watch(
  () => createForm.chartId,
  async (chartId) => {
    selectedChartStages.value = [];
    if (!chartId || !createForm.teamId) return;
    try {
      loadingChartStages.value = true;
      const res = await getStagesByChartRequest(chartId, createForm.teamId);
      selectedChartStages.value = res.data || [];
    } catch {} finally {
      loadingChartStages.value = false;
    }
  },
);

watch(teamFilter, async (teamId) => {
  if (!teamId) return;
  listError.value = '';
  try {
    await Promise.all([
      tasksStore.fetchTeamTasks(teamId),
      teamsStore.fetchMembers(teamId),
    ]);
  } catch {
    listError.value = 'Unable to load tasks for the team';
  }
});

const myRole = computed(() => {
  if (!authStore.user?.id) return null;
  return teamsStore.members.find((m) => m.userId === authStore.user.id)?.role ?? null;
});

const canEdit = (task) =>
  myRole.value === 'OWNER' ||
  myRole.value === 'MANAGER' ||
  task.createdBy === authStore.user?.id;

const canDelete = () =>
  myRole.value === 'OWNER' || myRole.value === 'MANAGER';

const ERRORS = {
  UNAUTHORIZED_TEAM_ACCESS: 'You have no access to this team',
  PROJECT_NOT_FOUND: 'The project does not exist',
  PROJECT_TEAM_MISMATCH: 'The project does not belong to this team',
};

const mapError = (error, fallback) => {
  const code = error.response?.data?.error?.code;
  return ERRORS[code] || error.response?.data?.message || fallback;
};

const _stagesCache = {};

const DEFAULT_STAGE_NAMES = {
  'to do': 'PENDING',
  'in progress': 'IN_PROGRESS',
  'review': 'REVIEW',
  'done': 'COMPLETED',
};

const findStageForStatus = (stages, status) => {
  const byMapped = stages.find((s) => s.mappedStatus === status);
  if (byMapped) return byMapped;
  // Fallback: buscar por nombre canónico si mappedStatus no está guardado en Firestore
  const name = Object.entries(DEFAULT_STAGE_NAMES).find(([, v]) => v === status)?.[0];
  if (!name) return null;
  return stages.find((s) => s.name.toLowerCase() === name) ?? null;
};

const getChartStages = async (chartId, teamId) => {
  if (_stagesCache[chartId]) return _stagesCache[chartId];
  try {
    const res = await getStagesByChartRequest(chartId, teamId);
    const stages = res.data || [];
    _stagesCache[chartId] = stages;
    // Persiste mappedStatus en stages que tengan nombre canónico pero el campo vacío
    for (const stage of stages) {
      if (stage.mappedStatus) continue;
      const inferred = DEFAULT_STAGE_NAMES[stage.name.toLowerCase()];
      if (!inferred) continue;
      try {
        await updateStageRequest(stage.id, { mappedStatus: inferred });
        stage.mappedStatus = inferred;
      } catch {}
    }
    return stages;
  } catch {
    return [];
  }
};

const moveToPairedStage = async (task, newStatus) => {
  if (!task.stageId || !task.chartId) return;
  const stages = await getChartStages(task.chartId, task.teamId);
  const target = findStageForStatus(stages, newStatus);
  if (!target || target.id === task.stageId) return;
  await moveTaskRequest(task.id, task.stageId, target.id);
  const idx = tasksStore.tasks.findIndex((t) => t.id === task.id);
  if (idx !== -1) {
    tasksStore.tasks.splice(idx, 1, { ...tasksStore.tasks[idx], stageId: target.id });
  }
};

const openEdit = (task) => {
  editingTask.value = task;
  editForm.name = task.name;
  editForm.priority = String(task.priority ?? 2);
  editForm.description = task.description || '';
  editForm.dueDate = task.dueDate ? task.dueDate.split('T')[0] : '';
  editForm.maxWorkers = getMaxWorkers(task) ? String(getMaxWorkers(task)) : '';
  editError.value = '';
};

const handleSaveEdit = async () => {
  if (!editForm.name.trim() || !editingTask.value) return;
  try {
    savingEdit.value = true;
    editError.value = '';
    const tags = (editingTask.value.tags || []).filter((t) => !t.startsWith('maxWorkers:'));
    const max = parseInt(editForm.maxWorkers);
    if (Number.isFinite(max) && max > 0) tags.push(`maxWorkers:${max}`);
    const payload = {
      name: editForm.name.trim(),
      priority: Number(editForm.priority),
      description: editForm.description,
      dueDate: editForm.dueDate ? new Date(editForm.dueDate).toISOString() : null,
      tags,
    };
    await tasksStore.updateTask(editingTask.value.id, payload);
    editingTask.value = null;
  } catch (err) {
    editError.value = err.response?.data?.message || 'Unable to update task';
  } finally {
    savingEdit.value = false;
  }
};

const chartsForTask = (task) =>
  chartsStore.charts.filter((c) => c.teamId === task.teamId);

const handleSendToBoard = async (task, chartId) => {
  boardPickerOpen.value = null;
  if (!chartId) return;
  try {
    sendingToBoardId.value = task.id;
    const stages = await getChartStages(chartId, task.teamId);
    const target = findStageForStatus(stages, task.status) || stages[0];
    if (!target) return;
    await tasksStore.updateTask(task.id, { chartId, stageId: target.id });
  } catch {} finally {
    sendingToBoardId.value = null;
  }
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
    if (createForm.chartId && selectedChartStages.value.length > 0) {
      payload.chartId = createForm.chartId;
      payload.stageId = selectedChartStages.value[0].id;
    }

    await tasksStore.createTask(payload);
    createSuccess.value = 'Task created correctly';
    createForm.name = '';
    createForm.description = '';
    createForm.dueDate = '';
    createForm.priority = '2';
    createForm.maxWorkers = '';
    createForm.chartId = '';
    selectedChartStages.value = [];
  } catch (error) {
    createError.value = mapError(error, 'Could not create task');
  } finally {
    creating.value = false;
  }
};

const handleAdvance = async (task) => {
  const snapshot = { ...task };
  const nextStatus = task.status === 'PENDING' ? 'IN_PROGRESS' : 'REVIEW';
  try {
    advancingId.value = task.id;
    await tasksStore.advanceStatus(task.id);
    await moveToPairedStage(snapshot, nextStatus);
  } catch {

  } finally {
    advancingId.value = null;
  }
};

const handleComplete = async (task) => {
  const snapshot = { ...task };
  try {
    advancingId.value = task.id;
    await tasksStore.completeReview(task.id);
    await moveToPairedStage(snapshot, 'COMPLETED');
  } catch {

  } finally {
    advancingId.value = null;
  }
};

const handleJoin = async (task) => {
  try {
    claimingId.value = task.id;
    await tasksStore.joinTask(task.id, authStore.user?.id);
  } catch {

  } finally {
    claimingId.value = null;
  }
};

const handleClaimReview = async (task) => {
  try {
    claimingId.value = task.id;
    await tasksStore.claimTask(task.id, authStore.user?.id);
  } catch {

  } finally {
    claimingId.value = null;
  }
};

const handleReject = async (task) => {
  const snapshot = { ...task };
  try {
    rejectingId.value = task.id;
    await tasksStore.rejectReview(task.id);
    await moveToPairedStage(snapshot, 'IN_PROGRESS');
  } catch {
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
  } catch {}

  try { await chartsStore.fetchCharts(); } catch {}

  try {
    const result = await fetchUserList();
    allUsers.value = result.data || [];
  } catch {}
});
</script>

<template>
  <section class="space-y-6">
    <PageHeader title="Tasks" subtitle="Tasks assigned" />

    <div class="grid gap-6 xl:grid-cols-[1fr_360px]">
      <!-- Lista de tareas -->
      <div class="space-y-4">
        <!-- Selector de equipo -->
        <div class="flex items-center gap-3">
          <label class="text-sm font-medium text-slate-700">Team:</label>
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
        <LoadingState v-if="tasksStore.loading" message="Loading tasks..." />

        <div
          v-else-if="!filteredTasks.length"
          class="rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <EmptyState
            title="No tasks"
            :description="
              statusFilter === 'ALL'
                ? 'Create your first task.'
                : 'No tasks with this status.'
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
                <div class="flex min-w-0 items-center gap-1.5">
                  <span class="truncate text-sm font-semibold text-slate-950">{{ task.name }}</span>
                  <RouterLink
                    :to="{ name: 'task-detail', params: { taskId: task.id } }"
                    class="shrink-0 text-slate-400 hover:text-indigo-500"
                    title="Comments"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                  </RouterLink>
                </div>
                <p class="mt-0.5 text-xs text-slate-400">
                  {{ teamName(task.teamId) }} · {{ projectName(task.projectId) }}
                  <template v-if="getMaxWorkers(task)">
                    ·
                    <span :class="isFull(task) ? 'font-medium text-rose-500' : 'text-slate-400'">
                      {{ (task.assignedUserIds || []).length }}/{{ getMaxWorkers(task) }} Workers
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
              <span v-if="isOverdue(task.dueDate, task.status)"> · Expired</span>
            </p>

            <div class="mt-3 border-t border-slate-100 pt-3">
              <!-- Asignados / Contribuidores -->
              <div class="mb-2 space-y-1">
                <div class="flex flex-wrap items-center gap-1">
                  <span class="text-xs text-slate-400">
                    {{ task.status === 'COMPLETED' ? 'Completed by:' : 'Asigned to:' }}
                  </span>
                  <template v-if="isUnassigned(task)">
                    <span class="text-xs text-slate-400">No one</span>
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
                  <span class="text-xs text-slate-400">Worked by:</span>
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
                  Assign me
                </BaseButton>

                <!-- Avanzar estado: Iniciar / Revisar (solo el asignado, no en REVIEW) -->
                <BaseButton
                  v-if="isMyTask(task) && ['PENDING', 'IN_PROGRESS'].includes(task.status)"
                  variant="secondary"
                  size="sm"
                  :loading="advancingId === task.id"
                  @click="handleAdvance(task)"
                >
                  {{ task.status === 'PENDING' ? 'Start' : 'Send to review' }}
                </BaseButton>

                <!-- Tomar revisión: solo usuarios que NO trabajaron en la tarea -->
                <BaseButton
                  v-if="task.status === 'REVIEW' && !isMyTask(task) && !isWorker(task)"
                  variant="secondary"
                  size="sm"
                  :loading="claimingId === task.id"
                  @click="handleClaimReview(task)"
                >
                  Assign review
                </BaseButton>

                <!-- Acciones del revisor asignado -->
                <template v-if="isMyTask(task) && task.status === 'REVIEW'">
                  <BaseButton
                    variant="secondary"
                    size="sm"
                    :loading="rejectingId === task.id"
                    @click="handleReject(task)"
                  >
                    Return to progress
                  </BaseButton>
                  <BaseButton
                    variant="primary"
                    size="sm"
                    :loading="advancingId === task.id"
                    @click="handleComplete(task)"
                  >
                    Complete
                  </BaseButton>
                </template>

                <!-- Ir al tablero kanban (tareas que ya tienen chart asignado) -->
                <RouterLink
                  v-if="task.chartId && task.projectId"
                  :to="`/projects/${task.projectId}/kanban/${task.chartId}`"
                  class="inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  View chart
                </RouterLink>

                <!-- Enviar al tablero: solo tareas sin stage asignado -->
                <template v-if="!task.stageId && chartsForTask(task).length">
                  <template v-if="boardPickerOpen === task.id">
                    <select
                      class="h-8 rounded border border-slate-300 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      :disabled="sendingToBoardId === task.id"
                      @change="handleSendToBoard(task, $event.target.value)"
                      @blur="boardPickerOpen = null"
                    >
                      <option value="">Chose chart…</option>
                      <option v-for="chart in chartsForTask(task)" :key="chart.id" :value="chart.id">
                        {{ chart.name }}
                      </option>
                    </select>
                  </template>
                  <BaseButton
                    v-else
                    variant="secondary"
                    size="sm"
                    :loading="sendingToBoardId === task.id"
                    @click="boardPickerOpen = task.id"
                  >
                    → Chart
                  </BaseButton>
                </template>

                <BaseButton
                  v-if="canEdit(task)"
                  variant="secondary"
                  size="sm"
                  @click="openEdit(task)"
                >
                  Edit
                </BaseButton>

                <button
                  v-if="canDelete()"
                  type="button"
                  class="danger-button h-8 px-3 text-xs"
                  @click="openDelete(task.id)"
                >
                  Delete
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
          <h2 class="text-base font-semibold text-slate-950">Create tasks</h2>

          <div class="mt-4 space-y-2">
            <BaseInput id="task-name" v-model="createForm.name" label="Name" required />
            <BaseSelect
              id="task-team"
              v-model="createForm.teamId"
              label="Team"
              :options="teamOptions"
              :disabled="!teamOptions.length"
            />
            <BaseSelect
              id="task-project"
              v-model="createForm.projectId"
              label="Project"
              :options="projectOptions"
              :disabled="!projectOptions.length"
            />
            <BaseSelect
              id="task-chart"
              v-model="createForm.chartId"
              label="Chart (optional)"
              :options="[{ value: '', label: 'Sin tablero' }, ...chartOptions]"
              :disabled="!chartOptions.length || loadingChartStages"
            />
            <BaseSelect
              id="task-priority"
              v-model="createForm.priority"
              label="Priority"
              :options="PRIORITY_OPTIONS"
            />
            <BaseInput
              id="task-due"
              v-model="createForm.dueDate"
              label="Expiry date"
              type="date"
            />
            <BaseInput
              id="task-max-workers"
              v-model="createForm.maxWorkers"
              label="Max. workers"
              type="number"
              min="1"
              max="20"
              placeholder="No limit"
            />
            <BaseTextarea
              id="task-desc"
              v-model="createForm.description"
              label="Description"
              :rows="3"
            />
          </div>

          <p v-if="!teamOptions.length" class="mt-2 text-xs text-slate-400">
            You must belong to a team to create tasks.
          </p>
          <p v-else-if="!projectOptions.length && createForm.teamId" class="mt-2 text-xs text-slate-400">
            The selected team does not have active projects.
          </p>

          <AlertMessage v-if="createError" type="error" :message="createError" class="mt-3" />
          <AlertMessage v-if="createSuccess" type="success" :message="createSuccess" class="mt-3" />

          <BaseButton
            type="submit"
            :loading="creating"
            :disabled="!createForm.teamId || !createForm.projectId"
            class="mt-4 w-full"
          >
            Create task
          </BaseButton>
        </form>
      </aside>
    </div>

    <!-- Modal editar tarea -->
    <Teleport to="body">
      <div
        v-if="editingTask"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @click.self="editingTask = null"
      >
        <div class="w-full max-w-md rounded-xl bg-white shadow-xl">
          <div class="border-b border-slate-100 px-6 py-4">
            <h2 class="text-base font-semibold text-slate-900">Edit task</h2>
          </div>
          <div class="space-y-3 px-6 py-4">
            <BaseInput v-model="editForm.name" label="Name" required />
            <BaseSelect
              v-model="editForm.priority"
              label="Priority"
              :options="PRIORITY_OPTIONS"
            />
            <BaseInput v-model="editForm.dueDate" label="Expiry date" type="date" />
            <BaseInput
              v-model="editForm.maxWorkers"
              label="Max. workers"
              type="number"
              min="1"
              max="20"
              placeholder="Sin límite"
            />
            <BaseTextarea v-model="editForm.description" label="Description" :rows="3" />
            <AlertMessage v-if="editError" type="error" :message="editError" />
          </div>
          <div class="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
            <BaseButton variant="secondary" size="sm" :disabled="savingEdit" @click="editingTask = null">
              Cancel
            </BaseButton>
            <BaseButton size="sm" :loading="savingEdit" :disabled="!editForm.name.trim()" @click="handleSaveEdit">
              Save
            </BaseButton>
          </div>
        </div>
      </div>
    </Teleport>

    <ConfirmDialog
      :open="deleteConfirm.open"
      title="Delete task?"
      description="This CANNOT be undone."
      confirm-label="Delete"
      confirm-variant="danger"
      :loading="deleteConfirm.loading"
      @confirm="handleDeleteConfirm"
      @cancel="deleteConfirm.open = false"
    />
  </section>
</template>
