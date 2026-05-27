import api from './axios';

export const loginRequest = async (data) => {
  const response = await api.post('/auth/login', data);

  return response.data;
};

export const registerRequest = async (data) => {
  const response = await api.post('/auth/register', data);

  return response.data;
};

export const meRequest = async () => {
  const response = await api.get('/auth/me');

  return response.data;
};

export const refreshRequest = async (refreshToken) => {
  const response = await api.post('/auth/refresh', {
    refreshToken,
  });

  return response.data;
};

export const logoutRequest = async () => {
  const response = await api.post('/auth/logout');

  return response.data;
};

export const changePasswordRequest = async (data) => {
  const response = await api.patch('/auth/change-password', data);

  return response.data;
};
