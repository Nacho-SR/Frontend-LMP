import api from './axios'

export const getNotificationsRequest = async (data) =>
{
  const response = await api.get('/notifications', data);

  return response.data;
}
export const getNotificationRequest = async (notifId) =>
{
  const response = await api.get(`/notifications/${notifId}`);

  return response.data;
}
export const readAllNotificationsRequest = async () =>
{
  const response = await api.patch(`/notifications/read-all`);

  return response.data;
}

export const deleteNotification = async (notifId) => {
  const response = await api.delete(`/notifications/${notifId}`);

  return response.data;
}

export const toggleReadNotification = async (notifId,route) => {
  const response = await api.patch(`/notifications/${notifId}/${route}`);

  return response.data;
}