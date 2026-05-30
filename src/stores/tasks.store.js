import { defineStore } from 'pinia';
import {
  assignTaskRequest,
  createTaskRequest,
  deleteTaskRequest,
  getMyTasksRequest,
  getTeamTasksRequest,
  updateTaskRequest,
  updateTaskStatusRequest,
  getTaskDetailRequest,   
  getTaskCommentsRequest,  
  postTaskCommentRequest, 
  deleteTaskCommentRequest,     
} from '../api/tasks.service';

const NEXT_STATUS = {
  PENDING: 'IN_PROGRESS',
  IN_PROGRESS: 'REVIEW',
  REVIEW: 'COMPLETED',
};

export const NEXT_LABEL = {
  PENDING: 'Iniciar',
  IN_PROGRESS: 'Revisar',
};

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    tasks: [],
    selectedTask: null,
    comments: [],
    loading: false,
  }),

  actions: {
    async fetchTaskDetail(taskId) {
      this.loading = true;
      try {
        const localTask = this.tasks.find((t) => t.id === taskId);
        if (localTask) {
          this.selectedTask = localTask;
        }
        
        const response = await getTaskDetailRequest(taskId);
        // CORREGIDO: Extrae los datos reales desempaquetando el successResponse del backend
        this.selectedTask = response?.data ? response.data : (response || null);
      } finally {
        this.loading = false;
      }
    },

    async fetchTaskComments(taskId) {
      try {
        const response = await getTaskCommentsRequest(taskId);
        let rawComments = [];

        if (response && response.data) {
          rawComments = Array.isArray(response.data) ? response.data : [];
        } else {
          rawComments = Array.isArray(response) ? response : [];
        }

        this.comments = rawComments.sort((a, b) => {
          const timeA = a.createdAt?._seconds ? a.createdAt._seconds * 1000 : new Date(a.createdAt || 0).getTime();
          const timeB = b.createdAt?._seconds ? b.createdAt._seconds * 1000 : new Date(b.createdAt || 0).getTime();
          return timeB - timeA; 
        });

      } catch (error) {
        console.error("Error en comentarios al recargar:", error);
        this.comments = [];
      }
    },

    async postTaskComment(taskId, commentPayload) {
      try {
        const response = await postTaskCommentRequest(taskId, commentPayload);
        
        const newComment = response?.data ? response.data : response;
        
        if (newComment && newComment.content) {
          const normalizedComment = {
            ...newComment,
            createdAt: newComment.createdAt || { _seconds: Math.floor(Date.now() / 1000) }
          };
          this.comments = [normalizedComment, ...this.comments];
          
          return normalizedComment;
        }

      } catch (error) {
        console.error("Error al procesar postComment en Pinia:", error);
        throw error;
      }
    },
    async deleteTaskComment(taskId,commentId) {
      try {
        await deleteTaskCommentRequest(taskId, commentId);
      this.comments = this.comments.filter(n => n.id !== commentId);
      } catch (error) {
        console.error("Failed to delete comment:", error);
        throw error;
      }
    },

    async fetchMyTasks(params = {}) {
      this.loading = true;
      try {
        const response = await getMyTasksRequest(params);
        this.tasks = response.data || [];
      } finally {
        this.loading = false;
      }
    },

    async fetchTeamTasks(teamId) {
      this.loading = true;
      try {
        const response = await getTeamTasksRequest(teamId);
        this.tasks = response.data || [];
      } finally {
        this.loading = false;
      }
    },

    async createTask(payload) {
      const response = await createTaskRequest(payload);
      this.tasks = [response.data, ...this.tasks];
      return response.data;
    },

    async advanceStatus(taskId) {
      const currentTask = this.tasks.find((t) => t.id === taskId) || this.selectedTask;
      if (!currentTask) return;
      const next = NEXT_STATUS[currentTask.status];
      if (!next) return;
      
      const response = await updateTaskStatusRequest(taskId, next);
      const updatedData = response?.data ? response.data : response;
      
      if (next === 'REVIEW') updatedData.assignedUserIds = [];

      if (this.selectedTask && this.selectedTask.id === taskId) {
        this.selectedTask = { ...this.selectedTask, ...updatedData };
      }
      const idx = this.tasks.findIndex((t) => t.id === taskId);
      if (idx !== -1) {
        this.tasks[idx] = { ...this.tasks[idx], ...updatedData };
      }
    },

    async completeReview(taskId) {
      const response = await updateTaskStatusRequest(taskId, 'COMPLETED');
      const updatedData = response?.data ? response.data : response;

      if (this.selectedTask && this.selectedTask.id === taskId) {
        this.selectedTask = { ...this.selectedTask, ...updatedData };
      }
      const idx = this.tasks.findIndex((t) => t.id === taskId);
      if (idx !== -1) {
        this.tasks[idx] = { ...this.tasks[idx], ...updatedData };
      }
    },

    async rejectReview(taskId) {
      const response = await updateTaskStatusRequest(taskId, 'IN_PROGRESS');
      let updatedData = response?.data ? response.data : response;
      updatedData = { ...updatedData, assignedUserIds: [], workerIds: [] };

      if (this.selectedTask && this.selectedTask.id === taskId) {
        this.selectedTask = { ...this.selectedTask, ...updatedData };
      }
      const idx = this.tasks.findIndex((t) => t.id === taskId);
      if (idx !== -1) {
        this.tasks[idx] = { ...this.tasks[idx], ...updatedData };
      }
    },

    async joinTask(taskId, userId) {
      const currentTask = this.tasks.find((t) => t.id === taskId) || this.selectedTask;
      if (!currentTask) return;
      const current = currentTask.assignedUserIds || [];
      if (current.includes(userId)) return;
      
      const response = await assignTaskRequest(taskId, [...current, userId]);
      const resData = response?.data ? response.data : response;
      
      if (this.selectedTask && this.selectedTask.id === taskId) {
        this.selectedTask.assignedUserIds = resData.assignedUserIds;
      }
      const idx = this.tasks.findIndex((t) => t.id === taskId);
      if (idx !== -1) {
        this.tasks[idx] = { ...this.tasks[idx], assignedUserIds: resData.assignedUserIds };
      }
    },

    async claimTask(taskId, userId) {
      const response = await assignTaskRequest(taskId, [userId]);
      const resData = response?.data ? response.data : response;

      if (this.selectedTask && this.selectedTask.id === taskId) {
        this.selectedTask.assignedUserIds = resData.assignedUserIds;
      }
      const idx = this.tasks.findIndex((t) => t.id === taskId);
      if (idx !== -1) {
        this.tasks[idx] = { ...this.tasks[idx], assignedUserIds: resData.assignedUserIds };
      }
    },

    async updateTask(taskId, payload) {
      const response = await updateTaskRequest(taskId, payload);
      const updated = response.data;
      const idx = this.tasks.findIndex((t) => t.id === taskId);
      if (idx !== -1) this.tasks.splice(idx, 1, { ...this.tasks[idx], ...updated });
      return updated;
    },

    async updateTask(taskId, payload) {
      const response = await updateTaskRequest(taskId, payload);
      const updated = response.data;
      const idx = this.tasks.findIndex((t) => t.id === taskId);
      if (idx !== -1) this.tasks.splice(idx, 1, { ...this.tasks[idx], ...updated });
      return updated;
    },

    async deleteTask(taskId) {
      await deleteTaskRequest(taskId);
      this.tasks = this.tasks.filter((t) => t.id !== taskId);
      if (this.selectedTask && this.selectedTask.id === taskId) {
        this.selectedTask = null;
      }
    },
  },
});