import { defineStore } from 'pinia';

import {
  assignTaskRequest,
  createTaskRequest,
  deleteTaskRequest,
  getMyTasksRequest,
  getTeamTasksRequest,
  updateTaskStatusRequest,
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
    loading: false,
  }),

  actions: {
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
      const task = this.tasks.find((t) => t.id === taskId);
      if (!task) return;
      const next = NEXT_STATUS[task.status];
      if (!next) return;
      const response = await updateTaskStatusRequest(taskId, next);
      const idx = this.tasks.findIndex((t) => t.id === taskId);
      if (idx !== -1) {
        const updated = { ...this.tasks[idx], ...response.data };
        // Al ir a REVIEW se limpian los asignados (el backend lo hace también, pero
        // forzamos aquí para que joinTask no lea la lista vieja si la respuesta
        // llega sin assignedUserIds)
        if (next === 'REVIEW') updated.assignedUserIds = [];
        this.tasks[idx] = updated;
      }
    },

    async completeReview(taskId) {
      const response = await updateTaskStatusRequest(taskId, 'COMPLETED');
      const idx = this.tasks.findIndex((t) => t.id === taskId);
      if (idx !== -1) {
        this.tasks[idx] = { ...this.tasks[idx], ...response.data };
      }
    },

    async rejectReview(taskId) {
      const response = await updateTaskStatusRequest(taskId, 'IN_PROGRESS');
      const idx = this.tasks.findIndex((t) => t.id === taskId);
      if (idx !== -1) {
        // Forzar limpieza local — joinTask no debe leer la lista del revisor anterior
        this.tasks[idx] = { ...this.tasks[idx], ...response.data, assignedUserIds: [] };
      }
    },

    // Añadirse a una tarea (múltiples trabajadores permitidos)
    async joinTask(taskId, userId) {
      const task = this.tasks.find((t) => t.id === taskId);
      if (!task) return;
      const current = task.assignedUserIds || [];
      if (current.includes(userId)) return;
      const response = await assignTaskRequest(taskId, [...current, userId]);
      const idx = this.tasks.findIndex((t) => t.id === taskId);
      if (idx !== -1) {
        this.tasks[idx] = { ...this.tasks[idx], assignedUserIds: response.data.assignedUserIds };
      }
    },

    // Reemplazar asignado (para tomar revisión — un solo revisor)
    async claimTask(taskId, userId) {
      const response = await assignTaskRequest(taskId, [userId]);
      const idx = this.tasks.findIndex((t) => t.id === taskId);
      if (idx !== -1) {
        this.tasks[idx] = { ...this.tasks[idx], assignedUserIds: response.data.assignedUserIds };
      }
    },

    async deleteTask(taskId) {
      await deleteTaskRequest(taskId);
      this.tasks = this.tasks.filter((t) => t.id !== taskId);
    },
  },
});
