import api from './axios';

export const fetchUserList = async () => {
  const response = await api.get('/users/list');
  return response.data;
};
