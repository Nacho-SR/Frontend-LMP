import { defineStore } from 'pinia';

import {
  createProjectRequest,
  deleteProjectRequest,
  getProjectRequest,
  getProjectsRequest,
  updateProjectRequest,
  updateProjectStatusRequest,
} from '../api/projects.service';

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [],
    selectedProject: null,
    loading: false,
    projectLoading: false,
  }),

  actions: {
    async fetchProjects() {
      this.loading = true;
      try {
        const response = await getProjectsRequest();
        this.projects = response.data || [];
      } finally {
        this.loading = false;
      }
    },

    async fetchProject(projectId) {
      this.projectLoading = true;
      try {
        const response = await getProjectRequest(projectId);
        this.selectedProject = response.data;
      } finally {
        this.projectLoading = false;
      }
    },

    async createProject(payload) {
      const response = await createProjectRequest(payload);
      this.projects = [response.data, ...this.projects];
      return response.data;
    },

    async updateProject(projectId, payload) {
      const response = await updateProjectRequest(projectId, payload);
      this._mergeSelected(response.data);
      this._updateInList(response.data);
      return response.data;
    },

    async updateProjectStatus(projectId, status) {
      const response = await updateProjectStatusRequest(projectId, status);
      this._mergeSelected(response.data);
      this._updateInList(response.data);
      return response.data;
    },

    async deleteProject(projectId) {
      await deleteProjectRequest(projectId);
      this.projects = this.projects.filter((p) => p.id !== projectId);
      this.selectedProject = null;
    },

    _mergeSelected(updated) {
      if (this.selectedProject) {
        this.selectedProject = { ...this.selectedProject, ...updated };
      }
    },

    _updateInList(updated) {
      const idx = this.projects.findIndex((p) => p.id === updated.id);
      if (idx !== -1) this.projects[idx] = { ...this.projects[idx], ...updated };
    },
  },
});
