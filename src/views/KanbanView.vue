<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';

import AlertMessage from '../components/ui/AlertMessage.vue';
import BaseButton from '../components/ui/BaseButton.vue';
import BaseInput from '../components/ui/BaseInput.vue';
import BaseSelect from '../components/ui/BaseSelect.vue';
import BaseTextarea from '../components/ui/BaseTextarea.vue';
import ConfirmDialog from '../components/ui/ConfirmDialog.vue';
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

// Task drag & drop
const draggedTaskId = ref(null);
const draggedFromStageId = ref(null);
const dragOverStageId = ref(null);
const movingTaskId = ref(null);

// Column drag & drop (reorder)
const draggedStageId = ref(null);
const dragOverColumnId = ref(null);

// Stage creation
const showCreateStage = ref(false);
const newStageName = ref('');
const creatingStage = ref(false);

// Stage inline editing
const editingStageId = ref(null);
const editingStageName = ref('');
const savingStageId = ref(null);
const deletingStageId = ref(null);

// Task detail / edit / delete
const selectedTask = ref(null);
const taskDetailMode = ref('view'); // 'view' | 'edit'
const savingEdit = ref(false);
const editError = ref('');
const deleteConfirm = reactive({ open: false, loading: false });

const joiningTask = ref(false);
const advancingTask = ref(false);
const rejectingTask = ref(false);
const assignUserId = ref('');
const assigningTask = ref(false);
const removingAssigneeId = ref('');
const assignError = ref('');
const assignSuccess = ref('');

const editForm = reactive({
  name: '',
  priority: '2',
  description: '',
  dueDate: '',
  maxWorkers: '',
});

const PRIORITY_LABEL = { 1: 'Baja', 2: 'Media', 3: 'Alta', 4: 'Urgente' };

const formatDate = (str) => {
  if (!str) return null;
  return new Date(str).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getMaxWorkers = (task) => {
  const tag = (task?.tags || []).find((t) => t.startsWith('maxWorkers:'));
  if (!tag) return null;
  const n = parseInt(tag.split(':')[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const stageName = (stageId) => stagesStore.stages.find((s) => s.id === stageId)?.name ?? '—';

const isMyTask = computed(() => selectedTask.value?.assignedUserIds?.includes(authStore.user?.id));
const isWorkerOf = computed(() => selectedTask.value?.workerIds?.includes(authStore.user?.id));
const isTaskFull = computed(() => {
  const max = getMaxWorkers(selectedTask.value);
  if (!max) return false;
  return (selectedTask.value?.assignedUserIds || []).length >= max;
});

const openTask = (task) => {
  selectedTask.value = task;
  taskDetailMode.value = 'view';
  editError.value = '';
  assignUserId.value = '';
  assignError.value = '';
  assignSuccess.value = '';
};

const openEditMode = () => {
  const t = selectedTask.value;
  editForm.name = t.name;
  editForm.priority = String(t.priority ?? 2);
  editForm.description = t.description || '';
  editForm.dueDate = t.dueDate ? t.dueDate.split('T')[0] : '';
  editForm.maxWorkers = getMaxWorkers(t) ? String(getMaxWorkers(t)) : '';
  assignUserId.value = '';
  assignError.value = '';
  assignSuccess.value = '';
  taskDetailMode.value = 'edit';
};

const handleUpdateTask = async () => {
  if (!editForm.name.trim()) return;
  try {
    savingEdit.value = true;
    editError.value = '';
    const tags = (selectedTask.value.tags || []).filter((t) => !t.startsWith('maxWorkers:'));
    const max = parseInt(editForm.maxWorkers);
    if (Number.isFinite(max) && max > 0) tags.push(`maxWorkers:${max}`);

    const payload = {
      name: editForm.name.trim(),
      priority: Number(editForm.priority),
      description: editForm.description,
      dueDate: editForm.dueDate ? new Date(editForm.dueDate).toISOString() : null,
      tags,
    };
    const taskId = selectedTask.value.id;
    const updated = await tasksStore.updateTask(taskId, payload);
    // Backend devuelve objeto parcial (sin description/tags), así que
    // fusionamos también los valores del formulario para reflejar el cambio completo
    const fullUpdated = {
      ...selectedTask.value,
      ...updated,
      name: payload.name,
      priority: payload.priority,
      description: payload.description,
      dueDate: payload.dueDate ?? selectedTask.value.dueDate,
      tags: payload.tags,
    };
    selectedTask.value = fullUpdated;
    // Sincronizar también en el store con los campos completos
    const storeIdx = tasksStore.tasks.findIndex((t) => t.id === taskId);
    if (storeIdx !== -1) {
      tasksStore.tasks.splice(storeIdx, 1, { ...tasksStore.tasks[storeIdx], ...fullUpdated });
    }
    taskDetailMode.value = 'view';
  } catch (error) {
    editError.value = error.response?.data?.message || 'No se pudo actualizar la tarea';
  } finally {
    savingEdit.value = false;
  }
};

const handleDeleteTask = async () => {
  try {
    deleteConfirm.loading = true;
    const stageId = selectedTask.value.stageId;
    await tasksStore.deleteTask(selectedTask.value.id);
    if (stageId) {
      const idx = stagesStore.stages.findIndex((s) => s.id === stageId);
      if (idx !== -1) {
        const stage = stagesStore.stages[idx];
        stagesStore.stages.splice(idx, 1, {
          ...stage,
          taskIds: (stage.taskIds || []).filter((id) => id !== selectedTask.value.id),
        });
      }
    }
    selectedTask.value = null;
    deleteConfirm.open = false;
  } catch {
    // ignore
  } finally {
    deleteConfirm.loading = false;
  }
};

// Sync selectedTask after store updates (store replaces the array item by reference)
const syncSelectedTask = () => {
  if (!selectedTask.value) return;
  const updated = tasksStore.tasks.find((t) => t.id === selectedTask.value.id);
  if (updated) selectedTask.value = { ...updated };
};

// Nombres canónicos de las etapas por defecto → mappedStatus
const DEFAULT_STAGE_NAMES = {
  'to do': 'PENDING',
  'in progress': 'IN_PROGRESS',
  'review': 'REVIEW',
  'done': 'COMPLETED',
};

// Encuentra la etapa del chart actual que tiene mappedStatus === status.
// Si ninguna lo tiene, intenta por nombre de etapa como fallback.
const stageForStatus = (status) => {
  const byMapped = stagesStore.stages.find((s) => s.mappedStatus === status);
  if (byMapped) return byMapped;
  const name = Object.entries(DEFAULT_STAGE_NAMES).find(([, v]) => v === status)?.[0];
  if (!name) return null;
  return stagesStore.stages.find((s) => s.name.toLowerCase() === name) ?? null;
};

// Persiste mappedStatus en stages que tengan nombre canónico pero el campo vacío.
// Se ejecuta en background tras cargar stages.
const repairStageMappings = async () => {
  for (const stage of stagesStore.stages) {
    if (stage.mappedStatus) continue;
    const inferredStatus = DEFAULT_STAGE_NAMES[stage.name.toLowerCase()];
    if (!inferredStatus) continue;
    try {
      await stagesStore.updateStage(stage.id, { mappedStatus: inferredStatus });
    } catch { /* usuario puede no tener permiso — ignorar */ }
  }
};

// Mueve el task a la etapa que corresponde al nuevo status (si existe y es diferente)
const moveToPairedStage = async (fromTask, newStatus) => {
  const target = stageForStatus(newStatus);
  if (!target || !fromTask.stageId || fromTask.stageId === target.id) return;
  await stagesStore.moveTask(fromTask.id, fromTask.stageId, target.id);
  const idx = tasksStore.tasks.findIndex((t) => t.id === fromTask.id);
  if (idx !== -1) {
    tasksStore.tasks.splice(idx, 1, { ...tasksStore.tasks[idx], stageId: target.id });
  }
};

const handleJoinTask = async () => {
  try {
    joiningTask.value = true;
    await tasksStore.joinTask(selectedTask.value.id, authStore.user?.id);
  } catch { /* ignore */ } finally {
    joiningTask.value = false;
    syncSelectedTask();
  }
};

const handleAssignSelectedUser = async () => {
  if (!selectedTask.value || !assignUserId.value || isTaskFull.value) return;

  const current = selectedTask.value.assignedUserIds || [];
  if (current.includes(assignUserId.value)) return;

  try {
    assigningTask.value = true;
    assignError.value = '';
    assignSuccess.value = '';

    await tasksStore.assignUsers(selectedTask.value.id, [...current, assignUserId.value]);
    syncSelectedTask();
    assignUserId.value = '';
    assignSuccess.value = 'Miembro asignado correctamente';
  } catch (error) {
    assignError.value = error.response?.data?.message || 'No se pudo asignar el miembro';
  } finally {
    assigningTask.value = false;
  }
};

const handleRemoveAssignedUser = async (userId) => {
  if (!selectedTask.value || !userId) return;

  const nextAssignedUserIds = (selectedTask.value.assignedUserIds || []).filter((id) => id !== userId);

  try {
    removingAssigneeId.value = userId;
    assignError.value = '';
    assignSuccess.value = '';

    await tasksStore.assignUsers(selectedTask.value.id, nextAssignedUserIds);
    syncSelectedTask();
    assignSuccess.value = 'Miembro removido de la tarea';
  } catch (error) {
    assignError.value = error.response?.data?.message || 'No se pudo quitar el miembro';
  } finally {
    removingAssigneeId.value = '';
  }
};

const handleAdvanceTask = async () => {
  if (!selectedTask.value) return;
  const task = { ...selectedTask.value };
  const nextStatus = task.status === 'PENDING' ? 'IN_PROGRESS' : 'REVIEW';
  advancingTask.value = true;
  stageError.value = '';
  try { await tasksStore.advanceStatus(task.id); } catch { /* ignore */ }
  try {
    await moveToPairedStage(task, nextStatus);
  } catch (err) {
    const code = err.response?.data?.error?.code;
    stageError.value = code === 'DESTINATION_WIP_LIMIT_REACHED'
      ? 'Límite WIP alcanzado en la columna destino'
      : err.response?.data?.message || 'No se pudo mover la tarea a la etapa correspondiente';
  }
  syncSelectedTask();
  advancingTask.value = false;
};

const handleCompleteTask = async () => {
  if (!selectedTask.value) return;
  const task = { ...selectedTask.value };
  advancingTask.value = true;
  stageError.value = '';
  try { await tasksStore.completeReview(task.id); } catch { /* ignore */ }
  try {
    await moveToPairedStage(task, 'COMPLETED');
  } catch (err) {
    const code = err.response?.data?.error?.code;
    stageError.value = code === 'DESTINATION_WIP_LIMIT_REACHED'
      ? 'Límite WIP alcanzado en la columna destino'
      : err.response?.data?.message || 'No se pudo mover la tarea a la etapa correspondiente';
  }
  syncSelectedTask();
  advancingTask.value = false;
};

const handleClaimReviewTask = async () => {
  try {
    joiningTask.value = true;
    await tasksStore.claimTask(selectedTask.value.id, authStore.user?.id);
  } catch { /* ignore */ } finally {
    joiningTask.value = false;
    syncSelectedTask();
  }
};

const handleRejectTask = async () => {
  if (!selectedTask.value) return;
  const task = { ...selectedTask.value };
  rejectingTask.value = true;
  stageError.value = '';
  try { await tasksStore.rejectReview(task.id); } catch { /* ignore */ }
  try {
    await moveToPairedStage(task, 'IN_PROGRESS');
  } catch (err) {
    const code = err.response?.data?.error?.code;
    stageError.value = code === 'DESTINATION_WIP_LIMIT_REACHED'
      ? 'Límite WIP alcanzado en la columna destino'
      : err.response?.data?.message || 'No se pudo mover la tarea a la etapa correspondiente';
  }
  syncSelectedTask();
  rejectingTask.value = false;
};

// Task creation
const showCreateTask = ref(false);
const savingTask = ref(false);
const createError = ref('');
const createSuccess = ref('');

const PRIORITY_OPTIONS = [
  { value: '1', label: 'Baja' },
  { value: '2', label: 'Media' },
  { value: '3', label: 'Alta' },
  { value: '4', label: 'Urgente' },
];

const createForm = reactive({
  name: '',
  priority: '2',
  description: '',
  dueDate: '',
  maxWorkers: '',
});

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
  const member = teamsStore.members.find((m) => m.userId === userId);
  if (member?.user) {
    return member.user.displayName || member.user.userName || member.user.email || null;
  }
  const u = allUsers.value.find((u) => u.id === userId);
  return u?.displayName || u?.userName || null;
};

const assignableMemberOptions = computed(() => {
  const assigned = selectedTask.value?.assignedUserIds || [];
  return teamsStore.members
    .filter((member) => member.userId && !assigned.includes(member.userId))
    .map((member) => ({
      value: member.userId,
      label: userName(member.userId) || member.userId,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

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
    dragOverColumnId.value = null;
  }
};

// ── Column reorder ─────────────────────────────────────────────────────────────
const onColumnDragStart = (event, stageId) => {
  draggedStageId.value = stageId;
  event.dataTransfer.effectAllowed = 'move';
};

const onColumnDragEnd = () => {
  draggedStageId.value = null;
  dragOverColumnId.value = null;
};

const onColumnDrop = async (toStageId) => {
  dragOverColumnId.value = null;
  if (!draggedStageId.value || draggedStageId.value === toStageId) {
    draggedStageId.value = null;
    return;
  }

  const fromId = draggedStageId.value;
  draggedStageId.value = null;

  const stages = [...stagesStore.stages];
  const fromIdx = stages.findIndex((s) => s.id === fromId);
  const toIdx = stages.findIndex((s) => s.id === toStageId);
  if (fromIdx === -1 || toIdx === -1) return;

  const [moved] = stages.splice(fromIdx, 1);
  stages.splice(toIdx, 0, moved);
  stagesStore.stages = stages; // optimistic update

  try {
    stageError.value = '';
    await stagesStore.reorderStages(
      props.chartId,
      chart.value.teamId,
      stages.map((s) => s.id),
    );
  } catch {
    await stagesStore.fetchStages(props.chartId, chart.value.teamId);
    stageError.value = 'No se pudo reordenar las etapas';
  }
};

// Dispatchers: decide if it's a column drag or a task drag
const handleDragOver = (stageId) => {
  if (draggedStageId.value) {
    dragOverColumnId.value = stageId;
  } else {
    onDragOver(stageId);
  }
};

const handleDrop = (stageId) => {
  if (draggedStageId.value) {
    onColumnDrop(stageId);
  } else {
    onDrop(stageId);
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

// ── Task creation ──────────────────────────────────────────────────────────────
const handleCreateTask = async () => {
  if (!createForm.name.trim()) return;
  const firstStage = stagesStore.stages[0];
  if (!firstStage) return;
  try {
    savingTask.value = true;
    createError.value = '';
    createSuccess.value = '';

    const tags = [];
    const max = parseInt(createForm.maxWorkers);
    if (Number.isFinite(max) && max > 0) tags.push(`maxWorkers:${max}`);

    const payload = {
      name: createForm.name.trim(),
      teamId: chart.value.teamId,
      projectId: props.projectId,
      chartId: props.chartId,
      stageId: firstStage.id,
      priority: Number(createForm.priority),
      description: createForm.description,
      tags,
    };
    if (createForm.dueDate) {
      payload.dueDate = new Date(createForm.dueDate).toISOString();
    }

    const task = await tasksStore.createTask(payload);

    const idx = stagesStore.stages.findIndex((s) => s.id === firstStage.id);
    if (idx !== -1) {
      const stage = stagesStore.stages[idx];
      stagesStore.stages.splice(idx, 1, {
        ...stage,
        taskIds: [...(stage.taskIds || []), task.id],
      });
    }

    createForm.name = '';
    createForm.description = '';
    createForm.dueDate = '';
    createForm.priority = '2';
    createForm.maxWorkers = '';
    showCreateTask.value = false;
    createSuccess.value = 'Tarea creada correctamente';
  } catch (error) {
    createError.value = error.response?.data?.message || 'No se pudo crear la tarea';
  } finally {
    savingTask.value = false;
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
    // Repara stages que tienen nombre canónico pero mappedStatus vacío en Firestore
    repairStageMappings();
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
      <div class="mt-2 flex items-center justify-between gap-4">
        <PageHeader :title="chart?.name || 'Tablero'" subtitle="Kanban" />
        <button
          v-if="stagesStore.stages.length"
          type="button"
          class="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          @click="showCreateTask = true; createError = ''; createSuccess = ''"
        >
          + Nueva tarea
        </button>
      </div>
    </div>

    <AlertMessage v-if="pageError" type="error" :message="pageError" class="shrink-0" />
    <AlertMessage v-if="stageError" type="error" :message="stageError" class="shrink-0" />
    <AlertMessage v-if="createSuccess" type="success" :message="createSuccess" class="shrink-0" />

    <LoadingState v-if="loading" message="Cargando tablero..." />

    <template v-else>
      <!-- Tablero: scroll horizontal -->
      <div class="min-h-0 flex-1 overflow-x-auto pb-4">
        <div class="flex h-full gap-4" style="min-width: max-content">

          <!-- Columnas de etapas -->
          <div
            v-for="stage in stagesStore.stages"
            :key="stage.id"
            class="flex h-full w-72 flex-col rounded-lg border border-slate-200 bg-slate-50 shadow-sm transition-all"
            :class="[
              dragOverStageId === stage.id ? 'border-indigo-400 bg-indigo-50' : '',
              dragOverColumnId === stage.id ? 'ring-2 ring-indigo-400 ring-offset-1' : '',
              draggedStageId === stage.id ? 'opacity-40' : '',
            ]"
            @dragover.prevent="handleDragOver(stage.id)"
            @dragleave="onDragLeave"
            @drop.prevent="handleDrop(stage.id)"
          >
            <!-- Cabecera columna -->
            <div class="flex items-center justify-between rounded-t-lg bg-white px-3 py-2.5 shadow-sm">
              <!-- Handle de arrastre (reordenar columnas) -->
              <div
                v-if="canManageStages"
                draggable="true"
                class="mr-1 shrink-0 cursor-grab text-slate-300 hover:text-slate-500 active:cursor-grabbing"
                title="Arrastrar para reordenar"
                @dragstart.stop="onColumnDragStart($event, stage.id)"
                @dragend.stop="onColumnDragEnd"
              >
                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <circle cx="7" cy="4" r="1.5"/>
                  <circle cx="13" cy="4" r="1.5"/>
                  <circle cx="7" cy="10" r="1.5"/>
                  <circle cx="13" cy="10" r="1.5"/>
                  <circle cx="7" cy="16" r="1.5"/>
                  <circle cx="13" cy="16" r="1.5"/>
                </svg>
              </div>

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
                class="cursor-pointer rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
                :class="movingTaskId === task.id ? 'opacity-40' : ''"
                @dragstart="onDragStart($event, task.id, stage.id)"
                @click="openTask(task)"
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

  <!-- Modal: detalle de tarea -->
  <Teleport to="body">
    <Transition name="dialog">
      <div
        v-if="selectedTask"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="selectedTask = null"
      >
        <div class="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" @click="selectedTask = null" />

        <div class="relative w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-lg">
          <!-- Cabecera modal -->
          <div class="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
            <div class="min-w-0 flex-1">
              <p v-if="taskDetailMode === 'view'" class="text-base font-semibold text-slate-950 leading-snug">
                {{ selectedTask.name }}
              </p>
              <p v-else class="text-sm font-medium text-slate-500">Editar tarea</p>
            </div>
            <button
              type="button"
              class="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              @click="selectedTask = null"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Cuerpo: modo vista -->
          <div v-if="taskDetailMode === 'view'" class="space-y-3 px-6 py-4">
            <!-- Badges -->
            <div class="flex flex-wrap gap-2">
              <span
                class="rounded px-2 py-0.5 text-xs font-medium"
                :class="statusColor[selectedTask.status] || 'text-slate-500 bg-slate-100'"
              >
                {{ statusLabel[selectedTask.status] || selectedTask.status }}
              </span>
              <span
                class="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium"
                :class="[
                  selectedTask.priority >= 4 ? 'bg-red-50 text-red-700' :
                  selectedTask.priority === 3 ? 'bg-orange-50 text-orange-700' :
                  selectedTask.priority === 2 ? 'bg-yellow-50 text-yellow-700' :
                  'bg-green-50 text-green-700'
                ]"
              >
                {{ PRIORITY_LABEL[selectedTask.priority] || 'Media' }}
              </span>
            </div>

            <!-- Descripción -->
            <p v-if="selectedTask.description" class="text-sm text-slate-600">
              {{ selectedTask.description }}
            </p>
            <p v-else class="text-sm text-slate-400 italic">Sin descripción</p>

            <!-- Metadatos -->
            <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt class="text-xs font-medium text-slate-400">Etapa</dt>
                <dd class="text-slate-700">{{ stageName(selectedTask.stageId) }}</dd>
              </div>
              <div v-if="selectedTask.dueDate">
                <dt class="text-xs font-medium text-slate-400">Fecha límite</dt>
                <dd class="text-slate-700">{{ formatDate(selectedTask.dueDate) }}</dd>
              </div>
              <div v-if="getMaxWorkers(selectedTask)">
                <dt class="text-xs font-medium text-slate-400">Máx. trabajadores</dt>
                <dd class="text-slate-700">{{ getMaxWorkers(selectedTask) }}</dd>
              </div>
            </dl>

            <!-- Asignados -->
            <div v-if="selectedTask.assignedUserIds?.length">
              <p class="mb-1 text-xs font-medium text-slate-400">Asignado a</p>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="uid in selectedTask.assignedUserIds"
                  :key="uid"
                  class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                >
                  {{ userName(uid) || uid }}
                </span>
              </div>
            </div>

            <div v-if="canManageStages" class="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div class="min-w-0 flex-1">
                  <BaseSelect
                    id="task-member-assignee"
                    v-model="assignUserId"
                    label="Asignar miembro"
                    placeholder="Selecciona un miembro"
                    :options="assignableMemberOptions"
                    :disabled="assigningTask || isTaskFull || !assignableMemberOptions.length"
                  />
                </div>
                <BaseButton
                  size="sm"
                  class="sm:mb-0.5"
                  :loading="assigningTask"
                  :disabled="!assignUserId || isTaskFull"
                  @click="handleAssignSelectedUser"
                >
                  Asignar
                </BaseButton>
              </div>
              <p v-if="isTaskFull" class="mt-2 text-xs text-slate-500">
                La tarea ya alcanzÃ³ el mÃ¡ximo de trabajadores.
              </p>
              <p v-else-if="!assignableMemberOptions.length" class="mt-2 text-xs text-slate-500">
                Todos los miembros disponibles ya estÃ¡n asignados.
              </p>
              <AlertMessage v-if="assignError" type="error" :message="assignError" class="mt-3" />
              <AlertMessage v-if="assignSuccess" type="success" :message="assignSuccess" class="mt-3" />
            </div>
          </div>

          <!-- Cuerpo: modo edición (solo OWNER/MANAGER) -->
          <div v-else class="px-6 py-4">
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <BaseInput id="et-name" v-model="editForm.name" label="Nombre" required />
              </div>
              <BaseSelect
                id="et-priority"
                v-model="editForm.priority"
                label="Prioridad"
                :options="PRIORITY_OPTIONS"
              />
              <BaseInput id="et-due" v-model="editForm.dueDate" label="Fecha límite" type="date" />
              <BaseInput
                id="et-workers"
                v-model="editForm.maxWorkers"
                label="Máx. trabajadores"
                type="number"
                min="1"
                max="20"
                placeholder="Sin límite"
              />
              <div class="sm:col-span-2">
                <BaseTextarea id="et-desc" v-model="editForm.description" label="Descripción" :rows="3" />
              </div>
            </div>
            <div class="mt-4 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
              <div class="flex items-center justify-between gap-3">
                <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Miembros asignados</p>
                <span class="text-xs text-slate-500">
                  {{ selectedTask.assignedUserIds?.length || 0 }}{{ getMaxWorkers(selectedTask) ? `/${getMaxWorkers(selectedTask)}` : '' }}
                </span>
              </div>

              <div class="mt-3 flex flex-wrap gap-2">
                <span v-if="!selectedTask.assignedUserIds?.length" class="text-sm text-slate-500">
                  Nadie asignado
                </span>
                <span
                  v-for="uid in selectedTask.assignedUserIds"
                  :key="uid"
                  class="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
                >
                  {{ userName(uid) || uid }}
                  <button
                    type="button"
                    class="rounded-full px-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-50"
                    :disabled="removingAssigneeId === uid || assigningTask"
                    :aria-label="`Quitar a ${userName(uid) || uid}`"
                    @click="handleRemoveAssignedUser(uid)"
                  >
                    {{ removingAssigneeId === uid ? '...' : 'x' }}
                  </button>
                </span>
              </div>

              <div class="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                <div class="min-w-0 flex-1">
                  <BaseSelect
                    id="edit-task-member-assignee"
                    v-model="assignUserId"
                    label="Agregar miembro"
                    placeholder="Selecciona un miembro"
                    :options="assignableMemberOptions"
                    :disabled="assigningTask || isTaskFull || !assignableMemberOptions.length"
                  />
                </div>
                <BaseButton
                  size="sm"
                  class="sm:mb-0.5"
                  :loading="assigningTask"
                  :disabled="!assignUserId || isTaskFull"
                  @click="handleAssignSelectedUser"
                >
                  Agregar
                </BaseButton>
              </div>

              <p v-if="isTaskFull" class="mt-2 text-xs text-slate-500">
                La tarea ya alcanzÃ³ el mÃ¡ximo de trabajadores.
              </p>
              <p v-else-if="!assignableMemberOptions.length" class="mt-2 text-xs text-slate-500">
                Todos los miembros disponibles ya estÃ¡n asignados.
              </p>
              <AlertMessage v-if="assignError" type="error" :message="assignError" class="mt-3" />
              <AlertMessage v-if="assignSuccess" type="success" :message="assignSuccess" class="mt-3" />
            </div>
            <AlertMessage v-if="editError" type="error" :message="editError" class="mt-3" />
          </div>

          <!-- Pie del modal -->
          <div class="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
            <template v-if="taskDetailMode === 'view'">
              <!-- Asignarme: tarea pendiente/en-progreso sin cupo lleno y no soy asignado -->
              <BaseButton
                v-if="!isMyTask && ['PENDING', 'IN_PROGRESS'].includes(selectedTask.status) && !isTaskFull"
                variant="secondary"
                size="sm"
                :loading="joiningTask"
                @click="handleJoinTask"
              >
                Asignarme
              </BaseButton>

              <!-- Avanzar estado: solo si soy asignado en PENDING o IN_PROGRESS -->
              <BaseButton
                v-if="isMyTask && ['PENDING', 'IN_PROGRESS'].includes(selectedTask.status)"
                variant="secondary"
                size="sm"
                :loading="advancingTask"
                @click="handleAdvanceTask"
              >
                {{ selectedTask.status === 'PENDING' ? 'Iniciar' : 'Enviar a revisión' }}
              </BaseButton>

              <!-- Tomar revisión: tarea en REVIEW, no soy el asignado actual y no trabajé en ella -->
              <BaseButton
                v-if="selectedTask.status === 'REVIEW' && !isMyTask && !isWorkerOf"
                variant="secondary"
                size="sm"
                :loading="joiningTask"
                @click="handleClaimReviewTask"
              >
                Asignar revisión
              </BaseButton>

              <!-- Acciones del revisor asignado -->
              <template v-if="isMyTask && selectedTask.status === 'REVIEW'">
                <BaseButton
                  variant="secondary"
                  size="sm"
                  :loading="rejectingTask"
                  @click="handleRejectTask"
                >
                  Regresar a progreso
                </BaseButton>
                <BaseButton
                  size="sm"
                  :loading="advancingTask"
                  @click="handleCompleteTask"
                >
                  Completar
                </BaseButton>
              </template>

              <!-- Gestión (OWNER/MANAGER) -->
              <template v-if="canManageStages">
                <BaseButton variant="secondary" size="sm" @click="openEditMode">Editar</BaseButton>
                <BaseButton variant="danger" size="sm" @click="deleteConfirm.open = true">Eliminar</BaseButton>
              </template>
              <BaseButton variant="secondary" size="sm" @click="selectedTask = null">Cerrar</BaseButton>
            </template>
            <template v-else>
              <BaseButton variant="secondary" size="sm" :disabled="savingEdit" @click="taskDetailMode = 'view'; editError = ''">Cancelar</BaseButton>
              <BaseButton size="sm" :loading="savingEdit" :disabled="!editForm.name.trim()" @click="handleUpdateTask">Guardar</BaseButton>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <ConfirmDialog
    :open="deleteConfirm.open"
    title="¿Eliminar tarea?"
    description="Esta acción eliminará la tarea permanentemente. No se puede deshacer."
    confirm-label="Eliminar"
    confirm-variant="danger"
    :loading="deleteConfirm.loading"
    @confirm="handleDeleteTask"
    @cancel="deleteConfirm.open = false"
  />

  <!-- Modal: nueva tarea -->
  <Teleport to="body">
    <Transition name="dialog">
      <div
        v-if="showCreateTask"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showCreateTask = false"
      >
        <div class="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" @click="showCreateTask = false" />

        <div class="relative w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-lg">
          <h2 class="text-base font-semibold text-slate-950">
            Nueva tarea
            <span class="ml-1 font-normal text-slate-400 text-sm">→ {{ stagesStore.stages[0]?.name || 'To Do' }}</span>
          </h2>

          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <BaseInput id="kt-name" v-model="createForm.name" label="Nombre" required />
            </div>
            <BaseSelect
              id="kt-priority"
              v-model="createForm.priority"
              label="Prioridad"
              :options="PRIORITY_OPTIONS"
            />
            <BaseInput
              id="kt-due"
              v-model="createForm.dueDate"
              label="Fecha límite"
              type="date"
            />
            <BaseInput
              id="kt-workers"
              v-model="createForm.maxWorkers"
              label="Máx. trabajadores"
              type="number"
              min="1"
              max="20"
              placeholder="Sin límite"
            />
            <div class="sm:col-span-2">
              <BaseTextarea
                id="kt-desc"
                v-model="createForm.description"
                label="Descripción"
                :rows="3"
              />
            </div>
          </div>

          <AlertMessage v-if="createError" type="error" :message="createError" class="mt-3" />
          <AlertMessage v-if="createSuccess" type="success" :message="createSuccess" class="mt-3" />

          <div class="mt-5 flex justify-end gap-2">
            <button
              type="button"
              class="secondary-button"
              :disabled="savingTask"
              @click="showCreateTask = false"
            >
              Cancelar
            </button>
            <BaseButton
              :loading="savingTask"
              :disabled="!createForm.name.trim()"
              @click="handleCreateTask"
            >
              Crear tarea
            </BaseButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.15s ease;
}
.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}
</style>
