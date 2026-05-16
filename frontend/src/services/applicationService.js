import api from './api';

export const applicationService = {
  apply: (jobId, data) => {
    const formData = new FormData();
    if (data.resume) formData.append('resume', data.resume);
    if (data.coverLetter) formData.append('coverLetter', data.coverLetter);
    if (data.phone) formData.append('phone', data.phone);
    if (data.telegram) formData.append('telegram', data.telegram);
    return api.post(`/applications/${jobId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getMyApplications: () => api.get('/applications/my'),
  getJobApplications: (jobId) => api.get(`/applications/job/${jobId}`),
  updateStatus: (id, status) => api.patch(`/applications/${id}/status`, { status }),
  withdraw: (id) => api.delete(`/applications/${id}`),
};
