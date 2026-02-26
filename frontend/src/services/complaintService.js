import api from './api';

export const raiseComplaint = async (subject, description, category) => {
  const response = await api.post('/complaints', { subject, description, category });
  return response.data;
};

export const getMyComplaints = async (status) => {
  const params = status ? { status } : {};
  const response = await api.get('/complaints/my', { params });
  return response.data;
};

export const getTeamComplaints = async (status) => {
  const params = status ? { status } : {};
  const response = await api.get('/complaints/team', { params });
  return response.data;
};

export const reviewComplaint = async (complaintId, status, managerNote) => {
  const response = await api.put(`/complaints/${complaintId}/review`, { status, managerNote });
  return response.data;
};

export const withdrawComplaint = async (complaintId) => {
  const response = await api.put(`/complaints/${complaintId}/withdraw`);
  return response.data;
};
