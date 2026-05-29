<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

import AlertMessage from '../components/ui/AlertMessage.vue';
import BaseButton from '../components/ui/BaseButton.vue';
import BaseInput from '../components/ui/BaseInput.vue';
import BaseTextarea from '../components/ui/BaseTextarea.vue';
import ConfirmDialog from '../components/ui/ConfirmDialog.vue';
import LoadingState from '../components/ui/LoadingState.vue';
import PageHeader from '../components/ui/PageHeader.vue';
import StatusBadge from '../components/ui/StatusBadge.vue';
import { useAuthStore } from '../stores/auth.store';
import { useChartsStore } from '../stores/charts.store';
import { useProjectsStore } from '../stores/projects.store';
import { useTeamsStore } from '../stores/teams.store';

const props = defineProps({ projectId: { type: String, required: true } });
const router = useRouter();

const authStore = useAuthStore();
const projectsStore = useProjectsStore();
const teamsStore = useTeamsStore();
const chartsStore = useChartsStore();

const pageError = ref('');
const editError = ref('');
const editSuccess = ref('');
const statusError = ref('');
const deleteError = ref('');

// Charts
const projectCharts = computed(() =>
  chartsStore.charts.filter((c) => c.projectId === props.projectId && !c.isArchived)
);
const showCreateChart = ref(false);
const newChartName = ref('');
const creatingChart = ref(false);
const chartError = ref('');
const editingChartId = ref(null);
const editingChartName = ref('');
const savingChartId = ref(null);
const archiveConfirm = reactive({ open: false, chartId: null, loading: false });

const editing = ref(false);
const savingEdit = ref(false);
const savingStatus = ref(false);
const deleteConfirm = reactive({ open: false, loading: false });

const editForm = reactive({ name: '', description: '' });

const project = computed(() => projectsStore.selectedProject);

const myRole = computed(() => {
  const uid = authStore.user?.id;
  if (!uid) return null;
  return teamsStore.members.find((m) => m.userId === uid)?.role ?? null;
});

const canEdit = computed(() => ['OWNER', 'MANAGER'].includes(myRole.value));
const canDelete = computed(() => myRole.value === 'OWNER');

const taskSummary = computed(() =>
  project.value?.taskSummary ?? { total: 0, completed: 0, blocked: 0 },
);

const progress = computed(() => {
  const { total, completed } = taskSummary.value;
  return total > 0 ? Math.round((completed / total) * 100) : 0;
});

const ERRORS = {
  PROJECT_NOT_FOUND: 'Proyecto no encontrado',
  UNAUTHORIZED_TEAM_ACCESS: 'No tienes acceso a este proyecto',
  INSUFFICIENT_TEAM_ROLE: 'Tu rol no permite esta acción',
  CHART_NOT_FOUND: 'Tablero no encontrado',
  PROJECT_TEAM_MISMATCH: 'El proyecto no pertenece a este equipo',
};

const mapError = (error, fallback) => {
  const code = error.response?.data?.error?.code;
  return ERRORS[code] || error.response?.data?.message || fallback;
};

const loadProject = async () => {
  try {
    pageError.value = '';
    await projectsStore.fetchProject(props.projectId);
    if (project.value) {
      await Promise.all([
        teamsStore.fetchMembers(project.value.teamId),
        chartsStore.fetchCharts(),
      ]);
    }
  } catch (error) {
    pageError.value = mapError(error, 'No se pudo cargar el proyecto');
  }
};

const handleCreateChart = async () => {
  if (!newChartName.value.trim()) return;
  try {
    creatingChart.value = true;
    chartError.value = '';
    await chartsStore.createChart({
      name: newChartName.value.trim(),
      projectId: props.projectId,
      teamId: project.value.teamId,
    });
    newChartName.value = '';
    showCreateChart.value = false;
  } catch (error) {
    chartError.value = mapError(error, 'No se pudo crear el tablero');
  } finally {
    creatingChart.value = false;
  }
};

const openEditChart = (chart) => {
  editingChartId.value = chart.id;
  editingChartName.value = chart.name;
};

const handleSaveChart = async (chartId) => {
  if (!editingChartName.value.trim()) return;
  try {
    savingChartId.value = chartId;
    chartError.value = '';
    await chartsStore.updateChart(chartId, { name: editingChartName.value.trim() });
    editingChartId.value = null;
  } catch (error) {
    chartError.value = mapError(error, 'No se pudo actualizar el tablero');
  } finally {
    savingChartId.value = null;
  }
};

const handleArchiveChart = async () => {
  try {
    archiveConfirm.loading = true;
    await chartsStore.archiveChart(archiveConfirm.chartId);
    archiveConfirm.open = false;
    archiveConfirm.chartId = null;
  } catch (error) {
    chartError.value = mapError(error, 'No se pudo archivar el tablero');
    archiveConfirm.open = false;
  } finally {
    archiveConfirm.loading = false;
  }
};

const openEdit = () => {
  editForm.name = project.value.name;
  editForm.description = project.value.description || '';
  editError.value = '';
  editSuccess.value = '';
  editing.value = true;
};

const handleSaveEdit = async () => {
  try {
    savingEdit.value = true;
    editError.value = '';
    await projectsStore.updateProject(props.projectId, {
      name: editForm.name,
      description: editForm.description,
    });
    editSuccess.value = 'Proyecto actualizado';
    editing.value = false;
  } catch (error) {
    editError.value = mapError(error, 'No se pudo actualizar el proyecto');
  } finally {
    savingEdit.value = false;
  }
};

const handleToggleStatus = async () => {
  const newStatus = project.value.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
  try {
    savingStatus.value = true;
    statusError.value = '';
    await projectsStore.updateProjectStatus(props.projectId, newStatus);
  } catch (error) {
    statusError.value = mapError(error, 'No se pudo cambiar el estatus');
  } finally {
    savingStatus.value = false;
  }
};

const handleDelete = async () => {
  try {
    deleteConfirm.loading = true;
    deleteError.value = '';
    await projectsStore.deleteProject(props.projectId);
    router.push({ name: 'projects' });
  } catch (error) {
    deleteConfirm.open = false;
    deleteError.value = mapError(error, 'No se pudo eliminar el proyecto');
  } finally {
    deleteConfirm.loading = false;
  }
};

onMounted(loadProject);
watch(() => props.projectId, loadProject);
</script>

<template>
  <section class="space-y-6">
    <!-- Cabecera -->
    <div>
      <RouterLink
        :to="{ name: 'projects' }"
        class="inline-flex items-center gap-1 text-sm font-medium text-slate-500 underline underline-offset-4"
      >
        ← Proyectos
      </RouterLink>

      <div class="mt-3 flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          :title="project?.name || 'Proyecto'"
          :subtitle="project?.description || ''"
        />
        <StatusBadge v-if="project" :status="project.status || 'ACTIVE'" />
      </div>
    </div>

    <AlertMessage v-if="pageError" type="error" :message="pageError" />

    <LoadingState v-if="projectsStore.projectLoading" message="Cargando proyecto..." />

    <template v-else-if="project">
      <!-- Tableros (Charts) -->
      <div>
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-base font-semibold text-slate-950">Tableros</h2>
          <button
            v-if="canEdit && !showCreateChart"
            type="button"
            class="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            @click="showCreateChart = true"
          >
            + Nuevo tablero
          </button>
        </div>

        <AlertMessage v-if="chartError" type="error" :message="chartError" class="mb-3" />

        <!-- Formulario crear -->
        <div v-if="showCreateChart" class="mb-4 flex gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <BaseInput
            id="new-chart-name"
            v-model="newChartName"
            label=""
            placeholder="Nombre del tablero"
            class="flex-1"
            @keyup.enter="handleCreateChart"
          />
          <BaseButton :loading="creatingChart" @click="handleCreateChart">Crear</BaseButton>
          <button
            type="button"
            class="secondary-button"
            @click="showCreateChart = false; newChartName = ''"
          >
            Cancelar
          </button>
        </div>

        <LoadingState v-if="chartsStore.loading" message="Cargando tableros..." />

        <div v-else-if="projectCharts.length === 0 && !showCreateChart" class="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
          Este proyecto no tiene tableros. {{ canEdit ? 'Crea uno para empezar.' : '' }}
        </div>

        <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="chart in projectCharts"
            :key="chart.id"
            class="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <!-- Nombre / edición inline -->
            <div v-if="editingChartId === chart.id" class="flex gap-2">
              <input
                v-model="editingChartName"
                class="flex-1 rounded border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                @keyup.enter="handleSaveChart(chart.id)"
                @keyup.escape="editingChartId = null"
              />
              <button
                type="button"
                class="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                :disabled="savingChartId === chart.id"
                @click="handleSaveChart(chart.id)"
              >
                {{ savingChartId === chart.id ? '...' : 'Guardar' }}
              </button>
              <button type="button" class="text-xs text-slate-400 hover:text-slate-600" @click="editingChartId = null">
                Cancelar
              </button>
            </div>
            <div v-else>
              <p class="font-medium text-slate-950">{{ chart.name }}</p>
              <p class="mt-0.5 text-xs text-slate-400">
                {{ (chart.stageIds || []).length }} etapa{{ (chart.stageIds || []).length !== 1 ? 's' : '' }}
              </p>
            </div>

            <!-- Acciones -->
            <div class="mt-4 flex items-center gap-2">
              <RouterLink
                :to="{ name: 'kanban', params: { projectId, chartId: chart.id } }"
                class="flex-1 rounded bg-indigo-600 px-3 py-1.5 text-center text-sm font-medium text-white hover:bg-indigo-700"
              >
                Abrir tablero
              </RouterLink>
              <template v-if="canEdit && editingChartId !== chart.id">
                <button
                  type="button"
                  class="rounded px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100"
                  @click="openEditChart(chart)"
                >
                  Renombrar
                </button>
                <button
                  type="button"
                  class="rounded px-2 py-1.5 text-xs text-red-500 hover:bg-red-50"
                  @click="archiveConfirm.open = true; archiveConfirm.chartId = chart.id"
                >
                  Archivar
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <div class="grid gap-6 xl:grid-cols-[1fr_320px]">
        <!-- Resumen de tareas -->
        <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-base font-semibold text-slate-950">Resumen de tareas</h2>

          <div class="mt-4 space-y-4">
            <!-- Barra de progreso -->
            <div>
              <div class="mb-1 flex items-center justify-between text-xs text-slate-500">
                <span>Progreso</span>
                <span>{{ progress }}%</span>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-indigo-500 transition-all duration-300"
                  :style="{ width: progress + '%' }"
                />
              </div>
            </div>

            <!-- Estadísticas -->
            <div class="grid grid-cols-3 gap-3">
              <div class="rounded-lg bg-slate-50 p-3 text-center">
                <p class="text-2xl font-semibold text-slate-950">{{ taskSummary.total }}</p>
                <p class="mt-0.5 text-xs text-slate-500">Total</p>
              </div>
              <div class="rounded-lg bg-green-50 p-3 text-center">
                <p class="text-2xl font-semibold text-green-700">{{ taskSummary.completed }}</p>
                <p class="mt-0.5 text-xs text-green-600">Completadas</p>
              </div>
              <div class="rounded-lg bg-red-50 p-3 text-center">
                <p class="text-2xl font-semibold text-red-700">{{ taskSummary.blocked }}</p>
                <p class="mt-0.5 text-xs text-red-600">Bloqueadas</p>
              </div>
            </div>

            <p v-if="taskSummary.total === 0" class="text-sm text-slate-400">
              Este proyecto aún no tiene tareas.
            </p>
          </div>
        </div>

        <!-- Panel de acciones -->
        <div class="space-y-4">
          <!-- Editar -->
          <div v-if="canEdit" class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-semibold text-slate-950">Editar proyecto</h2>
              <button
                v-if="!editing"
                type="button"
                class="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                @click="openEdit"
              >
                Editar
              </button>
            </div>

            <template v-if="editing">
              <div class="mt-4 space-y-2">
                <BaseInput id="edit-name" v-model="editForm.name" label="Nombre" required />
                <BaseTextarea id="edit-desc" v-model="editForm.description" label="Descripción" :rows="2" />
              </div>
              <AlertMessage v-if="editError" type="error" :message="editError" class="mt-3" />
              <div class="mt-3 flex gap-2">
                <BaseButton :loading="savingEdit" class="flex-1" @click="handleSaveEdit">
                  Guardar
                </BaseButton>
                <button type="button" class="secondary-button" @click="editing = false">
                  Cancelar
                </button>
              </div>
            </template>

            <AlertMessage v-if="editSuccess && !editing" type="success" :message="editSuccess" class="mt-3" />
          </div>

          <!-- Cambiar estatus -->
          <div v-if="canEdit" class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="mb-3 text-base font-semibold text-slate-950">Estatus</h2>
            <AlertMessage v-if="statusError" type="error" :message="statusError" class="mb-3" />
            <BaseButton
              variant="secondary"
              :loading="savingStatus"
              class="w-full justify-center"
              @click="handleToggleStatus"
            >
              {{ project.status === 'ACTIVE' ? 'Archivar proyecto' : 'Reactivar proyecto' }}
            </BaseButton>
          </div>

          <!-- Zona de peligro -->
          <div v-if="canDelete" class="rounded-lg border border-red-100 bg-white p-5 shadow-sm">
            <h2 class="mb-3 text-base font-semibold text-slate-950">Zona de peligro</h2>
            <AlertMessage v-if="deleteError" type="error" :message="deleteError" class="mb-3" />
            <button
              type="button"
              class="danger-button w-full justify-center"
              @click="deleteConfirm.open = true"
            >
              Eliminar proyecto
            </button>
          </div>
        </div>
      </div>
    </template>

    <ConfirmDialog
      :open="deleteConfirm.open"
      title="¿Eliminar proyecto?"
      description="Esta acción eliminará el proyecto permanentemente. No se puede deshacer."
      confirm-label="Eliminar"
      confirm-variant="danger"
      :loading="deleteConfirm.loading"
      @confirm="handleDelete"
      @cancel="deleteConfirm.open = false"
    />

    <ConfirmDialog
      :open="archiveConfirm.open"
      title="¿Archivar tablero?"
      description="El tablero y sus etapas quedarán archivados. Las tareas no se eliminan."
      confirm-label="Archivar"
      confirm-variant="danger"
      :loading="archiveConfirm.loading"
      @confirm="handleArchiveChart"
      @cancel="archiveConfirm.open = false; archiveConfirm.chartId = null"
    />
  </section>
</template>
