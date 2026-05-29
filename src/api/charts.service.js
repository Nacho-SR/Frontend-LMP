import api from './axios';

export const getChartsRequest = async () => {
  const response = await api.get('/charts');
  return response.data;
};

export const getChartRequest = async (chartId) => {
  const response = await api.get(`/charts/${chartId}`);
  return response.data;
};

export const createChartRequest = async (data) => {
  const response = await api.post('/charts', data);
  return response.data;
};

export const updateChartRequest = async (chartId, data) => {
  const response = await api.patch(`/charts/${chartId}`, data);
  return response.data;
};

export const archiveChartRequest = async (chartId) => {
  const response = await api.delete(`/charts/${chartId}`);
  return response.data;
};
