import api from './api';

export const userService = {
  updateProfile: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((k) => { if (data[k] !== undefined) formData.append(k, data[k]); });
    return api.put('/users/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  changePassword: (data) => api.patch('/users/change-password', data),
  saveJob: (jobId) => api.post(`/users/saved/${jobId}`),
  getSavedJobs: () => api.get('/users/saved'),
  getAllUsers: () => api.get('/users'),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getStats: () => api.get('/users/stats'),
};
