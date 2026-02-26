import api from './api';

export const setLeaveAllocation = async (employeeId, totalLeaves) => {
  const response = await api.post('/leave-allocations', { employeeId, totalLeaves });
  return response.data;
};

export const getAllLeaveAllocations = async () => {
  const response = await api.get('/leave-allocations');
  return response.data;
};

export const updateLeaveAllocation = async (allocationId, totalLeaves) => {
  const response = await api.put(`/leave-allocations/${allocationId}`, { totalLeaves });
  return response.data;
};
