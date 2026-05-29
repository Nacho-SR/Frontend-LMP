import { defineStore } from 'pinia';

import {
  createStageRequest,
  deleteStageRequest,
  getStagesByChartRequest,
  moveTaskRequest,
  reorderStagesRequest,
  updateStageRequest,
} from '../api/stages.service';

export const useStagesStore = defineStore('stages', {
  state: () => ({
    stages: [],
    loading: false,
  }),

  actions: {
    async fetchStages(chartId, teamId) {
      this.loading = true;
      try {
        const response = await getStagesByChartRequest(chartId, teamId);
        this.stages = response.data || [];
      } finally {
        this.loading = false;
      }
    },

    async createStage(payload) {
      const response = await createStageRequest(payload);
      const stage = response.data;
      this.stages = [...this.stages, stage];
      return stage;
    },

    async updateStage(stageId, payload) {
      const response = await updateStageRequest(stageId, payload);
      const updated = response.data;
      const idx = this.stages.findIndex((s) => s.id === stageId);
      if (idx !== -1) this.stages.splice(idx, 1, { ...this.stages[idx], ...updated });
      return updated;
    },

    async deleteStage(stageId) {
      await deleteStageRequest(stageId);
      this.stages = this.stages.filter((s) => s.id !== stageId);
    },

    async moveTask(taskId, fromStageId, toStageId) {
      const response = await moveTaskRequest(taskId, fromStageId, toStageId);
      const { fromStage, toStage, task } = response.data;

      const fromIdx = this.stages.findIndex((s) => s.id === fromStageId);
      if (fromIdx !== -1) {
        this.stages.splice(fromIdx, 1, {
          ...this.stages[fromIdx],
          taskIds: fromStage.taskIds,
        });
      }

      const toIdx = this.stages.findIndex((s) => s.id === toStageId);
      if (toIdx !== -1) {
        this.stages.splice(toIdx, 1, {
          ...this.stages[toIdx],
          taskIds: toStage.taskIds,
        });
      }

      return task;
    },

    async reorderStages(chartId, teamId, stageIds) {
      const response = await reorderStagesRequest(chartId, teamId, stageIds);
      this.stages = response.data || [];
    },
  },
});
