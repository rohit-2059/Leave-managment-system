import api from './api';

export const applyLeave = async (leaveType, startDate, endDate, reason) => {
  const response = await api.post('/leaves', { leaveType, startDate, endDate, reason });
  return response.data;
};

export const getMyLeaves = async (status) => {
  const params = status ? { status } : {};
  const response = await api.get('/leaves/my', { params });
  return response.data;
};

export const getMyLeaveBalance = async () => {
  const response = await api.get('/leaves/balance');
  return response.data;
};

export const getTeamLeaveRequests = async (status, employeeId) => {
  const params = {};
  if (status) params.status = status;
  if (employeeId) params.employeeId = employeeId;
  const response = await api.get('/leaves/team', { params });
  return response.data;
};

export const reviewLeaveRequest = async (leaveId, status, managerNote) => {
  const response = await api.put(`/leaves/${leaveId}/review`, { status, managerNote });
  return response.data;
};

export const withdrawLeave = async (leaveId) => {
  const response = await api.put(`/leaves/${leaveId}/withdraw`);
  return response.data;
};

// Admin - Get all manager leave requests
export const getManagerLeaveRequests = async (status) => {
  const params = status ? { status } : {};
  const response = await api.get('/leaves/manager-requests', { params });
  return response.data;
};

// Admin - Review manager leave request
export const adminReviewLeave = async (leaveId, status, managerNote) => {
  const response = await api.put(`/leaves/${leaveId}/admin-review`, { status, managerNote });
  return response.data;
};

// Admin - Get escalated (manager-rejected) employee leaves
export const getEscalatedLeaves = async (override) => {
  const params = override ? { override } : {};
  const response = await api.get('/leaves/escalated', { params });
  return response.data;
};

// Admin - Override a manager-rejected leave
export const overrideLeaveRejection = async (leaveId, decision, adminNote) => {
  const response = await api.put(`/leaves/${leaveId}/override`, { decision, adminNote });
  return response.data;
};
