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
