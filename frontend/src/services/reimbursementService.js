import api from './api';

// Employee & Manager: apply
export const applyReimbursement = async (title, description, amount, category) => {
  const response = await api.post('/reimbursements', { title, description, amount, category });
  return response.data;
};

// Employee & Manager: get own
export const getMyReimbursements = async (status) => {
  const params = status ? { status } : {};
  const response = await api.get('/reimbursements/my', { params });
  return response.data;
};

// Employee & Manager: withdraw
export const withdrawReimbursement = async (id) => {
  const response = await api.put(`/reimbursements/${id}/withdraw`);
  return response.data;
};

// Manager: get team employee reimbursements
export const getTeamReimbursements = async (status) => {
  const params = status ? { status } : {};
  const response = await api.get('/reimbursements/team', { params });
  return response.data;
};

// Manager: approve/reject employee reimbursement
export const managerReviewReimbursement = async (id, status, note) => {
  const response = await api.put(`/reimbursements/${id}/manager-review`, { status, note });
  return response.data;
};

// Admin: get reimbursements pending admin approval
export const getAdminReimbursements = async (status) => {
  const params = status ? { status } : {};
  const response = await api.get('/reimbursements/admin', { params });
  return response.data;
};

// Admin: approve/reject
export const adminReviewReimbursement = async (id, status, note) => {
  const response = await api.put(`/reimbursements/${id}/admin-review`, { status, note });
  return response.data;
};
