import { defineStore } from 'pinia';

import {
  archiveChartRequest,
  createChartRequest,
  getChartRequest,
  getChartsRequest,
  updateChartRequest,
} from '../api/charts.service';

export const useChartsStore = defineStore('charts', {
  state: () => ({
    charts: [],
    selectedChart: null,
    loading: false,
    chartLoading: false,
  }),

  getters: {
    chartsByProject: (state) => (projectId) =>
      state.charts.filter((c) => c.projectId === projectId),
  },

  actions: {
    async fetchCharts() {
      this.loading = true;
      try {
        const response = await getChartsRequest();
        this.charts = response.data || [];
      } finally {
        this.loading = false;
      }
    },

    async fetchChart(chartId) {
      this.chartLoading = true;
      this.selectedChart = null;
      try {
        const response = await getChartRequest(chartId);
        this.selectedChart = response.data;
      } finally {
        this.chartLoading = false;
      }
    },

    async createChart(payload) {
      const response = await createChartRequest(payload);
      const chart = response.data;
      this.charts = [chart, ...this.charts];
      return chart;
    },

    async updateChart(chartId, payload) {
      const response = await updateChartRequest(chartId, payload);
      const updated = response.data;
      this._updateInList(updated);
      if (this.selectedChart?.id === chartId) {
        this.selectedChart = { ...this.selectedChart, ...updated };
      }
      return updated;
    },

    async archiveChart(chartId) {
      await archiveChartRequest(chartId);
      this.charts = this.charts.filter((c) => c.id !== chartId);
      if (this.selectedChart?.id === chartId) this.selectedChart = null;
    },

    _updateInList(updated) {
      const idx = this.charts.findIndex((c) => c.id === updated.id);
      if (idx !== -1) this.charts.splice(idx, 1, { ...this.charts[idx], ...updated });
    },
  },
});
