import { defineStore } from 'pinia';

import {
  addTeamMemberRequest,
  archiveTeamRequest,
  createTeamRequest,
  getTeamMembersRequest,
  getTeamRequest,
  getTeamsRequest,
  joinTeamRequest,
  removeTeamMemberRequest,
  updateTeamMemberRoleRequest,
  updateTeamRequest,
} from '../api/teams.service';

export const useTeamsStore = defineStore('teams', {
  state: () => ({
    teams: [],
    selectedTeam: null,
    members: [],
    loading: false,
    membersLoading: false,
  }),

  actions: {
    async fetchTeams() {
      this.loading = true;

      try {
        const response = await getTeamsRequest();
        this.teams = response.data || [];
      } finally {
        this.loading = false;
      }
    },

    async fetchTeam(teamId) {
      const response = await getTeamRequest(teamId);
      this.selectedTeam = response.data;
    },

    async createTeam(payload) {
      const response = await createTeamRequest(payload);
      this.teams = [response.data, ...this.teams];

      return response.data;
    },

    async updateTeam(teamId, payload) {
      const response = await updateTeamRequest(teamId, payload);
      const updated = response.data;

      if (this.selectedTeam?.id === teamId) {
        this.selectedTeam = {
          ...this.selectedTeam,
          ...updated,
        };
      }

      const index = this.teams.findIndex((team) => team.id === teamId);
      if (index !== -1) {
        this.teams[index] = {
          ...this.teams[index],
          ...updated,
        };
      }

      return updated;
    },

    async archiveTeam(teamId) {
      const response = await archiveTeamRequest(teamId);
      const archived = response.data;

      this.teams = this.teams.filter((team) => team.id !== teamId);

      if (this.selectedTeam?.id === teamId) {
        this.selectedTeam = archived || {
          ...this.selectedTeam,
          status: 'ARCHIVED',
        };
      }

      return archived;
    },

    async joinTeam(teamId, payload) {
      await joinTeamRequest(teamId, payload);
      await this.fetchTeams();
    },

    async fetchMembers(teamId) {
      this.membersLoading = true;

      try {
        const response = await getTeamMembersRequest(teamId);
        this.members = response.data || [];
      } finally {
        this.membersLoading = false;
      }
    },

    async addMember(teamId, payload) {
      await addTeamMemberRequest(teamId, payload);
      await this.fetchMembers(teamId);
    },

    async removeMember(teamId, userId) {
      await removeTeamMemberRequest(teamId, userId);
      this.members = this.members.filter((member) => member.userId !== userId);
    },

    async updateMemberRole(teamId, userId, role) {
      const response = await updateTeamMemberRoleRequest(teamId, userId, role);
      const updatedMember = response.data;

      const index = this.members.findIndex((member) => member.userId === userId);
      if (index !== -1) {
        this.members[index] = {
          ...this.members[index],
          ...updatedMember,
          role: updatedMember?.role || role,
        };
      }

      return updatedMember;
    },
  },
});
