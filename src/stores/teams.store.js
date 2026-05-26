import { defineStore } from 'pinia';

import {
  addTeamMemberRequest,
  createTeamRequest,
  getTeamMembersRequest,
  getTeamRequest,
  getTeamsRequest,
  joinTeamRequest,
  removeTeamMemberRequest,
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
  },
});
