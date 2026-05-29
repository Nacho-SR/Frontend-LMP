<script setup>
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';

import AlertMessage from '../components/ui/AlertMessage.vue';
import LoadingState from '../components/ui/LoadingState.vue';
import PageHeader from '../components/ui/PageHeader.vue';
import { fetchUserList } from '../api/users.service';
import { useAuthStore } from '../stores/auth.store';
import { useChartsStore } from '../stores/charts.store';
import { useStagesStore } from '../stores/stages.store';
import { useTasksStore } from '../stores/tasks.store';
import { useTeamsStore } from '../stores/teams.store';

const props = defineProps({
  projectId: { type: String, required: true },
  chartId: { type: String, required: true },
});

const authStore = useAuthStore();
const chartsStore = useChartsStore();
const stagesStore = useStagesStore();
const tasksStore = useTasksStore();
const teamsStore = useTeamsStore();

const chart = ref(null);
const allUsers = ref([]);
const pageError = ref('');
const stageError = ref('');
const loading = ref(true);

// Drag & drop
const draggedTaskId = ref(null);
const draggedFromStageId = ref(null);
const dragOverStageId = ref(null);
const movingTaskId = ref(null);

// Stage creation
const showCreateStage = ref(false);
const newStageName = ref('');
const creatingStage = ref(false);

// Stage inline editing
const editingStageId = ref(null);
const editingStageName = ref('');
const savingStageId = ref(null);
const deletingStageId = ref(null);

const myRole = computed(() => {
  const uid = authStore.user?.id;
  if (!uid) return null;
  return teamsStore.members.find((m) => m.userId === uid)?.role ?? null;
});

const canManageStages = computed(() => ['OWNER', 'MANAGER'].includes(myRole.value));

const tasksByStage = computed(() => {
  const map = {};
  for (const stage of stagesStore.stages) {
    map[stage.id] = tasksStore.tasks.filter(
      (t) => t.stageId === stage.id && t.chartId === props.chartId,
    );
  }
  return map;
});

const wipFull = (stage) => {
  if (!stage.wipLimit) return false;
  return (tasksByStage.value[stage.id] || []).length >= stage.wipLimit;
};

const userName = (userId) => {
  const u = allUsers.value.find((u) => u.id === userId);
  return u?.displayName || u?.userName || null;
};

const priorityDot = (priority) => {
  if (priority >= 4) return 'bg-red-500';
  if (priority === 3) return 'bg-orange-400';
  if (priority === 2) return 'bg-yellow-300';
  return 'bg-green-400';
};

const statusLabel = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  REVIEW: 'Revisión',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

const statusColor = {
  PENDING: 'text-slate-500 bg-slate-100',
  IN_PROGRESS: 'text-blue-700 bg-blue-50',
  REVIEW: 'text-amber-700 bg-amber-50',
  COMPLETED: 'text-green-700 bg-green-50',
  CANCELLED: 'text-red-600 bg-red-50',
};

// ── Drag & drop ────────────────────────────────────────────────────────────────
const onDragStart = (event, taskId, stageId) => {
  draggedTaskId.value = taskId;
  draggedFromStageId.value = stageId;
  event.dataTransfer.effectAllowed = 'move';
};

const onDragOver = (stageId) => {
  dragOverStageId.value = stageId;
};

const onDragLeave = (event) => {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    dragOverStageId.value = null;
  }
};

const onDrop = async (toStageId) => {
  dragOverStageId.value = null;
  if (!draggedTaskId.value || draggedFromStageId.value === toStageId) {
    draggedTaskId.value = null;
    draggedFromStageId.value = null;
    return;
  }

  const taskId = draggedTaskId.value;
  const fromStageId = draggedFromStageId.value;
  draggedTaskId.value = null;
  draggedFromStageId.value = null;

  try {
    movingTaskId.value = taskId;
    stageError.value = '';
    const updatedTask = await stagesStore.moveTask(taskId, fromStageId, toStageId);
    const idx = tasksStore.tasks.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      tasksStore.tasks.splice(idx, 1, { ...tasksStore.tasks[idx], ...updatedTask });
    }
  } catch (error) {
    const code = error.response?.data?.error?.code;
    stageError.value =
      code === 'DESTINATION_WIP_LIMIT_REACHED'
        ? 'Límite WIP alcanzado en la columna destino'
        : error.response?.data?.message || 'No se pudo mover la tarea';
  } finally {
    movingTaskId.value = null;
  }
};

// ── Stage CRUD ─────────────────────────────────────────────────────────────────
const handleCreateStage = async () => {
  if (!newStageName.value.trim()) return;
  try {
    creatingStage.value = true;
    stageError.value = '';
    await stagesStore.createStage({
      name: newStageName.value.trim(),
      teamId: chart.value.teamId,
      chartId: props.chartId,
    });
    newStageName.value = '';
    showCreateStage.value = false;
  } catch (error) {
    stageError.value = error.response?.data?.message || 'No se pudo crear la etapa';
  } finally {
    creatingStage.value = false;
  }
};

const openEditStage = (stage) => {
  editingStageId.value = stage.id;
  editingStageName.value = stage.name;
};

const handleSaveStage = async (stageId) => {
  if (!editingStageName.value.trim()) return;
  try {
    savingStageId.value = stageId;
    stageError.value = '';
    await stagesStore.updateStage(stageId, { name: editingStageName.value.trim() });
    editingStageId.value = null;
  } catch (error) {
    stageError.value = error.response?.data?.message || 'No se pudo actualizar la etapa';
  } finally {
    savingStageId.value = null;
  }
};

const handleDeleteStage = async (stageId) => {
  try {
    deletingStageId.value = stageId;
    stageError.value = '';
    await stagesStore.deleteStage(stageId);
  } catch (error) {
    const code = error.response?.data?.error?.code;
    stageError.value =
      code === 'STAGE_HAS_TASKS'
        ? 'La etapa tiene tareas. Muévelas antes de eliminarla.'
        : error.response?.data?.message || 'No se pudo eliminar la etapa';
  } finally {
    deletingStageId.value = null;
  }
};

// ── Init ───────────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    pageError.value = '';
    let found = chartsStore.charts.find((c) => c.id === props.chartId);
    if (!found) {
      await chartsStore.fetchChart(props.chartId);
      found = chartsStore.selectedChart;
    }
    if (!found) {
      pageError.value = 'Tablero no encontrado';
      return;
    }
    chart.value = found;

    await Promise.all([
      stagesStore.fetchStages(props.chartId, found.teamId),
      tasksStore.fetchTeamTasks(found.teamId),
      teamsStore.fetchMembers(found.teamId),
      fetchUserList().then((res) => {
        allUsers.value = res.data || [];
      }),
    ]);
  } catch {
    pageError.value = 'No se pudo cargar el tablero';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="flex flex-col gap-4" style="height: calc(100vh - 7rem); overflow: hidden;">
    <!-- Cabecera -->
    <div class="shrink-0">
      <RouterLink
        :to="{ name: 'project-detail', params: { projectId } }"
        class="inline-flex items-center gap-1 text-sm font-medium text-slate-500 underline underline-offset-4"
      >
        ← Proyecto
      </RouterLink>
      <div class="mt-2">
        <PageHeader :title="chart?.name || 'Tablero'" subtitle="Kanban" />
      </div>
    </div>

    <AlertMessage v-if="pageError" type="error" :message="pageError" class="shrink-0" />
    <AlertMessage v-if="stageError" type="error" :message="stageError" class="shrink-0" />

    <LoadingState v-if="loading" message="Cargando tablero..." />

    <template v-else>
      <!-- Tablero: scroll horizontal -->
      <div class="min-h-0 flex-1 overflow-x-auto pb-4">
        <div class="flex h-full gap-4" style="min-width: max-content">

          <!-- Columnas de etapas -->
          <div
            v-for="stage in stagesStore.stages"
            :key="stage.id"
            class="flex h-full w-72 flex-col rounded-lg border border-slate-200 bg-slate-50 shadow-sm transition-colors"
            :class="dragOverStageId === stage.id ? 'border-indigo-400 bg-indigo-50' : ''"
            @dragover.prevent="onDragOver(stage.id)"
            @dragleave="onDragLeave"
            @drop.prevent="onDrop(stage.id)"
          >
            <!-- Cabecera columna -->
            <div class="flex items-center justify-between rounded-t-lg bg-white px-3 py-2.5 shadow-sm">
              <!-- Nombre editable -->
              <div v-if="editingStageId === stage.id" class="flex flex-1 items-center gap-1">
                <input
                  v-model="editingStageName"
                  class="flex-1 rounded border border-slate-300 px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  @keyup.enter="handleSaveStage(stage.id)"
                  @keyup.escape="editingStageId = null"
                />
                <button
                  type="button"
                  class="text-xs font-medium text-indigo-600"
                  :disabled="savingStageId === stage.id"
                  @click="handleSaveStage(stage.id)"
                >
                  {{ savingStageId === stage.id ? '...' : 'Ok' }}
                </button>
                <button type="button" class="text-xs text-slate-400" @click="editingStageId = null">✕</button>
              </div>
              <div v-else class="flex flex-1 items-center gap-2 min-w-0">
                <span class="truncate text-sm font-semibold text-slate-800">{{ stage.name }}</span>
                <!-- Contador tareas / WIP -->
                <span
                  class="shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium"
                  :class="wipFull(stage) ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600'"
                >
                  {{ (tasksByStage[stage.id] || []).length }}
                  <template v-if="stage.wipLimit">/ {{ stage.wipLimit }}</template>
                </span>
              </div>
              <!-- Acciones de etapa -->
              <div v-if="canManageStages && editingStageId !== stage.id" class="ml-2 flex shrink-0 gap-1">
                <button
                  type="button"
                  class="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  title="Renombrar"
                  @click="openEditStage(stage)"
                >
                  <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  title="Eliminar etapa"
                  :disabled="deletingStageId === stage.id"
                  @click="handleDeleteStage(stage.id)"
                >
                  <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a1 1 0 00-1-1h-4a1 1 0 00-1 1H5" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Tarjetas de tareas -->
            <div class="flex-1 space-y-2 overflow-y-auto p-2">
              <div
                v-for="task in tasksByStage[stage.id]"
                :key="task.id"
                draggable="true"
                class="cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
                :class="movingTaskId === task.id ? 'opacity-40' : ''"
                @dragstart="onDragStart($event, task.id, stage.id)"
              >
                <!-- Prioridad + nombre -->
                <div class="flex items-start gap-2">
                  <span
                    class="mt-1 h-2 w-2 shrink-0 rounded-full"
                    :class="priorityDot(task.priority)"
                    :title="`Prioridad ${task.priority}`"
                  />
                  <p class="text-sm font-medium text-slate-800 leading-snug">{{ task.name }}</p>
                </div>

                <!-- Estado -->
                <div class="mt-2 flex items-center justify-between">
                  <span
                    class="rounded px-1.5 py-0.5 text-xs font-medium"
                    :class="statusColor[task.status] || 'text-slate-500 bg-slate-100'"
                  >
                    {{ statusLabel[task.status] || task.status }}
                  </span>
                </div>

                <!-- Asignados -->
                <div v-if="task.assignedUserIds?.length" class="mt-2 flex flex-wrap gap-1">
                  <span
                    v-for="uid in task.assignedUserIds"
                    :key="uid"
                    class="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600"
                  >
                    {{ userName(uid) || uid }}
                  </span>
                </div>
              </div>

              <p v-if="!tasksByStage[stage.id]?.length" class="py-4 text-center text-xs text-slate-400">
                Sin tareas
              </p>
            </div>
          </div>

          <!-- Columna: nueva etapa -->
          <div class="h-full w-72 shrink-0">
            <div
              v-if="showCreateStage"
              class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
            >
              <p class="mb-2 text-sm font-semibold text-slate-700">Nueva etapa</p>
              <input
                v-model="newStageName"
                placeholder="Nombre de la etapa"
                class="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                @keyup.enter="handleCreateStage"
                @keyup.escape="showCreateStage = false; newStageName = ''"
              />
              <div class="mt-2 flex gap-2">
                <button
                  type="button"
                  class="flex-1 rounded bg-indigo-600 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  :disabled="creatingStage"
                  @click="handleCreateStage"
                >
                  {{ creatingStage ? 'Creando...' : 'Crear' }}
                </button>
                <button
                  type="button"
                  class="rounded border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                  @click="showCreateStage = false; newStageName = ''"
                >
                  Cancelar
                </button>
              </div>
            </div>

            <button
              v-else-if="canManageStages"
              type="button"
              class="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 py-4 text-sm text-slate-400 hover:border-indigo-400 hover:text-indigo-500"
              @click="showCreateStage = true"
            >
              + Agregar etapa
            </button>
          </div>

        </div>
      </div>
    </template>
  </section>
</template>
