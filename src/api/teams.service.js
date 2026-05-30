import api from './axios';

export const getTeamsRequest = async () => {
  const response = await api.get('/teams');

  return response.data;
};

export const getTeamRequest = async (teamId) => {
  const response = await api.get(`/teams/${teamId}`);

  return response.data;
};

export const createTeamRequest = async (data) => {
  const response = await api.post('/teams', data);

  return response.data;
};

export const updateTeamRequest = async (teamId, data) => {
  const response = await api.patch(`/teams/${teamId}`, data);

  return response.data;
};

export const archiveTeamRequest = async (teamId) => {
  const response = await api.delete(`/teams/${teamId}`);

  return response.data;
};

export const joinTeamRequest = async (teamId, data) => {
  const response = await api.post(`/teams/${teamId}/join`, data);

  return response.data;
};

export const getTeamMembersRequest = async (teamId) => {
  const response = await api.get(`/teams/${teamId}/members`);

  return response.data;
};

export const addTeamMemberRequest = async (teamId, data) => {
  const response = await api.post(`/teams/${teamId}/members`, data);

  return response.data;
};

export const removeTeamMemberRequest = async (teamId, userId) => {
  const response = await api.delete(`/teams/${teamId}/members/${userId}`);

  return response.data;
};

export const updateTeamMemberRoleRequest = async (teamId, userId, role) => {
  const response = await api.patch(`/teams/${teamId}/members/${userId}/role`, {
    role,
  });

  return response.data;
};
