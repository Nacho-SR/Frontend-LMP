import api from './axios'

export const getNotificationsRequest = async (data) =>
{
  const response = await api.get('/notifications', data);

  return response.data;
}