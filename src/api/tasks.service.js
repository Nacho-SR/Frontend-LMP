import api from './axios';

export const getMyTasksRequest = async (params = {}) => {
  const response = await api.get('/tasks/my-tasks', { params });
  return response.data;
};

export const getTeamTasksRequest = async (teamId) => {
  const response = await api.get(`/tasks/team/${teamId}`);
  return response.data;
};

export const createTaskRequest = async (data) => {
  const response = await api.post('/tasks', data);
  return response.data;
};

export const updateTaskStatusRequest = async (taskId, status, comment = '') => {
  const response = await api.patch(`/tasks/${taskId}/status`, { status, comment });
  return response.data;
};

export const assignTaskRequest = async (taskId, userIds) => {
  const response = await api.post(`/tasks/${taskId}/assign`, { userIds });
  return response.data;
};

export const updateTaskRequest = async (taskId, data) => {
  const response = await api.put(`/tasks/${taskId}`, data);
  return response.data;
};

export const deleteTaskRequest = async (taskId) => {
  const response = await api.delete(`/tasks/${taskId}`);
  return response.data;
};

export const getTaskDetailRequest = async (taskId) => {
  const response = await api.get(`/tasks/${taskId}`);
  return response.data;
};

export const getTaskCommentsRequest = async (taskId) => {
  const response = await api.get(`/tasks/${taskId}/comments`);
  return response.data;
};


export const postTaskCommentRequest = async (taskId, commentData) => {
  const response = await api.post(`/tasks/${taskId}/comments`, commentData);
  return response.data;
};
export const deleteTaskCommentRequest = async (taskId,commentId) => {
  const response = await api.delete(`/tasks/${taskId}/comments/${commentId}`);
  return response.data;
};