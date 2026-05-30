<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router'; 

import AlertMessage from '../components/ui/AlertMessage.vue';
import BaseButton from '../components/ui/BaseButton.vue';
import BaseInput from '../components/ui/BaseInput.vue';
import BaseTextarea from '../components/ui/BaseTextarea.vue';
import ConfirmDialog from '../components/ui/ConfirmDialog.vue';
import EmptyState from '../components/ui/EmptyState.vue';
import LoadingState from '../components/ui/LoadingState.vue';
import PageHeader from '../components/ui/PageHeader.vue';
import PriorityBadge from '../components/ui/PriorityBadge.vue';
import StatusBadge from '../components/ui/StatusBadge.vue';

import { useAuthStore } from '../stores/auth.store';
import { useTeamsStore } from '../stores/teams.store';
import { useTasksStore } from '../stores/tasks.store';
import { useProjectsStore } from '../stores/projects.store';
import { fetchUserList } from '../api/users.service';

const props = defineProps({
  taskId: { type: String, required: true },
});

const router = useRouter(); 
const authStore = useAuthStore();
const tasksStore = useTasksStore();
const teamsStore = useTeamsStore();
const projectsStore = useProjectsStore();

const pageLoading = ref(true);
const pageError = ref('');
const commentContent = ref('');
const submittingComment = ref(false);
const actionLoading = ref(false);
const allUsers = ref([]);

const stableTeamId = ref('');
const stableProjectId = ref('');
const localRole = ref(null); 

const deleteConfirm = reactive({ open: false, loading: false });
const deleteConfirmComment = reactive({ open: false, commentId: null, loading: false });

const openDeleteComment = (commentId) => {
  deleteConfirmComment.commentId = commentId;
  deleteConfirmComment.open = true;
};

const taskFromList = computed(() => 
  tasksStore.tasks.find((t) => t.id === props.taskId)
);

const task = computed(() => {
  const detail = tasksStore.selectedTask;
  if (!detail) return taskFromList.value;
  return {
    ...detail,
    assignedUserIds: detail.assignedUserIds?.length ? detail.assignedUserIds : (taskFromList.value?.assignedUserIds || []),
    workerIds: detail.workerIds?.length ? detail.workerIds : (taskFromList.value?.workerIds || [])
  };
});

const comments = computed(() => tasksStore.comments || []);

const assignedUserIds = computed(() => task.value?.assignedUserIds || []);
const workerIds = computed(() => task.value?.workerIds || []);

const teamName = computed(() => 
  teamsStore.teams.find((t) => t.id === stableTeamId.value)?.name ?? '—'
);

const projectName = computed(() => 
  projectsStore.projects.find((p) => p.id === stableProjectId.value)?.name ?? '—'
);

const isMyTask = computed(() => assignedUserIds.value.includes(authStore.user?.id));
const canDelete = computed(() => ['OWNER', 'MANAGER'].includes(localRole.value));

const userName = (userId) => {
  const u = allUsers.value.find((u) => u.id === userId);
  return u?.displayName || u?.userName || userId;
};

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatTimestamp = (timestamp) => {  
  const date = new Date(timestamp._seconds * 1000);
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

const loadTaskData = async () => {
  try {
    pageError.value = '';
    pageLoading.value = true;
    
    await tasksStore.fetchTaskDetail(props.taskId);
    
    if (!task.value) {
      pageError.value = 'La tarea no existe.';
      return;
    }

    stableTeamId.value = task.value.teamId || '';
    stableProjectId.value = task.value.projectId || '';

    try { await teamsStore.fetchTeams(); } catch (e) {}
    try { if (projectsStore.projects?.find) await projectsStore.fetchProjects(); } catch (e) {}
    
    if (stableTeamId.value) {
      try { 
        await teamsStore.fetchMembers(stableTeamId.value); 
        
        const uid = authStore.user?.id;
        if (uid) {
          const member = teamsStore.members.find((m) => m.userId === uid);
          localRole.value = member?.role ?? null;
        }
      } catch (e) {
        console.error("Error al obtener roles del equipo", e);
      }
    }

    try {
      await tasksStore.fetchTaskComments(props.taskId);
    } catch (e) {}

  } catch (error) {
    pageError.value = 'No se pudo cargar la información detallada de la tarea';
  } finally {
    pageLoading.value = false;
  }
};

const handleAdvance = async () => {
  try {
    actionLoading.value = true;
    await tasksStore.advanceStatus(task.value.id);
  } catch { } finally { actionLoading.value = false; }
};

const handleReject = async () => {
  try {
    actionLoading.value = true;
    await tasksStore.rejectReview(task.value.id);
  } catch { } finally { actionLoading.value = false; }
};

const handleComplete = async () => {
  try {
    actionLoading.value = true;
    await tasksStore.completeReview(task.value.id);
  } catch {} finally { actionLoading.value = false; }
};

const handleAddComment = async () => {
  if (!commentContent.value.trim()) return;
  
  try {
    submittingComment.value = true;
    pageError.value = ''; 
    
    await tasksStore.postTaskComment(task.value.id, {
      content: commentContent.value.trim()
    });
    
    commentContent.value = '';
    
  } catch (error) {
    console.error("Error al publicar el comentario en el componente:", error);
    const serverMessage = error.response?.data?.message || 'No tienes permisos o el formato es incorrecto.';
    pageError.value = `No se pudo publicar el comentario: ${serverMessage}`;
  } finally {
    submittingComment.value = false;
  }
};

const handleDeleteTask = async () => {
  try {
    deleteConfirm.loading = true;
    await tasksStore.deleteTask(task.value.id);
    deleteConfirm.open = false;
    router.push({ name: 'tasks' }); 
  } catch {
    pageError.value = 'Error al intentar eliminar la tarea';
  } finally {
    deleteConfirm.loading = false;
  }
};
const handleDeleteTaskComment = async () => {
  try {
    deleteConfirmComment.loading = true;
    await tasksStore.deleteTaskComment(props.taskId,deleteConfirmComment.commentId);
    deleteConfirmComment.open = false;
  } catch {
    pageError.value = 'Error deleting commment';
  } finally {
    deleteConfirmComment.loading = false;
  }
};

onMounted(async () => {
  await loadTaskData();
  try {
    const result = await fetchUserList();
    allUsers.value = result.data || result || [];
  } catch { }
});
</script>

<template>
  <section class="space-y-6">
    <div>
      <RouterLink
        :to="{ name: 'tasks' }"
        class="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
      >
        ← Volver a Tareas
      </RouterLink>
    </div>

    <AlertMessage v-if="pageError" type="error" :message="pageError" />
    
    <LoadingState v-if="pageLoading" message="Cargando detalles de tarea..." />

    <div v-else class="grid gap-6 xl:grid-cols-[1fr_360px]">
      
      <div class="space-y-6">
        <div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div class="flex items-start justify-between gap-4">
            <div>
              <span class="text-xs font-mono text-slate-400">ID: {{ task?.id || props.taskId }}</span>
              <h1 class="text-2xl font-bold text-slate-950 mt-0.5">{{ task?.name || 'Cargando...' }}</h1>
            </div>
            <div class="flex items-center gap-2 shrink-0" v-if="task">
              <PriorityBadge :priority="task.priority" />
              <StatusBadge :status="task.status" />
            </div>
          </div>

          <div class="border-t border-slate-100 pt-4">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400">Descripción</h3>
            <p class="mt-1 text-sm text-slate-700 whitespace-pre-wrap">
              {{ task?.description || 'Sin descripción provista para esta tarea.' }}
            </p>
          </div>

          <div 
            v-if="task && workerIds.length && ['REVIEW', 'COMPLETED'].includes(task.status)" 
            class="border-t border-slate-100 pt-4"
          >
            <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400">Trabajadores Previos</h3>
            <div class="mt-1.5 flex flex-wrap gap-1">
              <span
                v-for="uid in workerIds"
                :key="uid"
                class="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700"
              >
                {{ userName(uid) }}
              </span>
            </div>
          </div>

          <div class="border-t border-slate-100 pt-4">
            <div>
              <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {{ task?.status === 'COMPLETED' ? 'Completado por' : 'Asignado a' }}
              </h3>
              <div class="mt-1.5 flex flex-wrap gap-1">
                <span v-if="!assignedUserIds.length" class="text-sm text-slate-500">
                  Nadie asignado
                </span>
                <span
                  v-for="uid in assignedUserIds"
                  :key="uid"
                  :class="[
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    uid === authStore.user?.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                  ]"
                >
                  {{ userName(uid) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col">
          <div class="border-b border-slate-200 px-5 py-4">
            <h2 class="text-base font-semibold text-slate-950">Comments</h2>
          </div>

          <div class="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-3 items-start">
            <div class="flex-1">
              <BaseTextarea
                id="task-comment-input"
                v-model="commentContent"
                placeholder="Comment"
                :rows="2"
                :disabled="submittingComment || !task"
              />
            </div>
            <BaseButton
              class="mt-6"
              size="sm"
              :loading="submittingComment"
              :disabled="!commentContent.trim() || !task"
              @click="handleAddComment"
            >
              Comment
            </BaseButton>
          </div>

          <div class="max-h-[400px] overflow-y-auto min-h-[60px] relative">
            
            <div v-if="!comments || !comments.length" class="p-4">
              <EmptyState
                title="No comments"
                description="No comments have been posted"
              />
            </div>

            <div v-else class="divide-y divide-slate-100 bg-white">
              <div
                v-for="comment in comments"
                :key="comment.id"
                class="p-4 flex flex-col gap-1 text-sm"
              >
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-slate-950">
                    {{ userName(comment.posterId) }}
                  </span>
                  <span class="text-xs text-slate-400">
                    {{ formatTimestamp(comment.createdAt) }}
                    
                  </span>
                </div>
                <p class="text-slate-600 whitespace-pre-wrap">
                  {{ comment.content }}
                  
                </p>
                  <button v-if="comment.posterId === authStore.user?.id" 
                  @click="openDeleteComment(comment.id)" 
                  class="self-end rounded px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                      Delete
                  </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <aside class="space-y-4">
        <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h2 class="text-base font-semibold text-slate-950 border-b border-slate-100 pb-2">Metadatos</h2>
          
          <div class="space-y-3 text-xs">
            <div>
              <span class="block text-slate-400 font-medium uppercase tracking-wider">Equipo</span>
              <span class="text-sm font-semibold text-slate-700">{{ teamName }}</span>
            </div>
            <div>
              <span class="block text-slate-400 font-medium uppercase tracking-wider">Proyecto</span>
              <span class="text-sm font-semibold text-slate-700">{{ projectName }}</span>
            </div>
            <div v-if="task?.dueDate">
              <span class="block text-slate-400 font-medium uppercase tracking-wider">Fecha de Vencimiento</span>
              <span class="text-sm font-semibold text-slate-700">
                {{ formatDate(task.dueDate) }}
              </span>
            </div>
          </div>

          <div class="border-t border-slate-100 pt-4 space-y-2" v-if="task">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Acciones de Flujo</h3>
            
            <BaseButton
              v-if="isMyTask && ['PENDING', 'IN_PROGRESS'].includes(task.status)"
              variant="primary"
              class="w-full justify-center"
              :loading="actionLoading"
              @click="handleAdvance"
            >
              {{ task.status === 'PENDING' ? 'Iniciar Tarea' : 'Enviar a Revisión' }}
            </BaseButton>

            <template v-if="isMyTask && task.status === 'REVIEW'">
              <BaseButton
                variant="secondary"
                class="w-full justify-center"
                :loading="actionLoading"
                @click="handleReject"
              >
                Regresar a Progreso
              </BaseButton>
              <BaseButton
                variant="primary"
                class="w-full justify-center mt-2"
                :loading="actionLoading"
                @click="handleComplete"
              >
                Aprobar y Completar
              </BaseButton>
            </template>

            <button
              v-if="canDelete"
              type="button"
              class="w-full rounded-md border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold p-2 transition-colors mt-4"
              @click="deleteConfirm.open = true"
            >
              Eliminar Tarea Permanentemente
            </button>
          </div>
        </div>
      </aside>
    </div>

    <ConfirmDialog
      :open="deleteConfirm.open"
      title="¿Eliminar tarea?"
      description="Esta acción eliminará la tarea permanentemente. No se puede deshacer."
      confirm-label="Eliminar Tarea"
      confirm-variant="danger"
      :loading="deleteConfirm.loading"
      @confirm="handleDeleteTask"
      @cancel="deleteConfirm.open = false"
    />
    <ConfirmDialog
      :open="deleteConfirmComment.open"
      title="Delete comment?"
      description="This cannnot be undone"
      confirm-label="Delete Comment"
      confirm-variant="danger"
      :loading="deleteConfirmComment.loading"
      @confirm="handleDeleteTaskComment"
      @cancel="deleteConfirmComment.open = false"
    />
  </section>
</template>