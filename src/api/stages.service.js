import api from './axios';

export const getStagesByChartRequest = async (chartId, teamId) => {
  const response = await api.get(`/stages/chart/${chartId}/team/${teamId}`);
  return response.data;
};

export const createStageRequest = async (data) => {
  const response = await api.post('/stages', data);
  return response.data;
};

export const updateStageRequest = async (stageId, data) => {
  const response = await api.patch(`/stages/${stageId}`, data);
  return response.data;
};

export const deleteStageRequest = async (stageId) => {
  const response = await api.delete(`/stages/${stageId}`);
  return response.data;
};

export const moveTaskRequest = async (taskId, fromStageId, toStageId) => {
  const response = await api.post('/stages/tasks/move', { taskId, fromStageId, toStageId });
  return response.data;
};

export const addTaskToStageRequest = async (stageId, taskId) => {
  const response = await api.post(`/stages/${stageId}/tasks`, { taskId });
  return response.data;
};

export const reorderStagesRequest = async (chartId, teamId, stageIds) => {
  const response = await api.patch(`/stages/chart/${chartId}/team/${teamId}/order`, { stageIds });
  return response.data;
};
