import api from './axios';

export const getProjectsRequest = async () => {
  const response = await api.get('/projects');
  return response.data;
};

export const getProjectRequest = async (projectId) => {
  const response = await api.get(`/projects/${projectId}`);
  return response.data;
};

export const createProjectRequest = async (data) => {
  const response = await api.post('/projects', data);
  return response.data;
};

export const updateProjectRequest = async (projectId, data) => {
  const response = await api.patch(`/projects/${projectId}`, data);
  return response.data;
};

export const updateProjectStatusRequest = async (projectId, status) => {
  const response = await api.patch(`/projects/${projectId}/status`, { status });
  return response.data;
};

export const deleteProjectRequest = async (projectId) => {
  const response = await api.delete(`/projects/${projectId}`);
  return response.data;
};
