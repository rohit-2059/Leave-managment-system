import api from './api';

// Admin - User Management
export const createManager = async (name, email, password) => {
  const response = await api.post('/users/create-manager', { name, email, password });
  return response.data;
};

export const createEmployee = async (name, email, password) => {
  const response = await api.post('/users/create-employee', { name, email, password });
  return response.data;
};

export const getAllManagers = async () => {
  const response = await api.get('/users/managers');
  return response.data;
};

export const getAllEmployees = async () => {
  const response = await api.get('/users/employees');
  return response.data;
};

export const getAllUsers = async () => {
  const response = await api.get('/users/all');
  return response.data;
};

export const getAdminOverview = async () => {
  const response = await api.get('/users/admin-overview');
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/users/${userId}`);
  return response.data;
};

// Manager - Team Management
export const getUnassignedEmployees = async () => {
  const response = await api.get('/users/unassigned-employees');
  return response.data;
};

export const assignEmployee = async (employeeId) => {
  const response = await api.post('/users/assign-employee', { employeeId });
  return response.data;
};

export const getMyTeam = async () => {
  const response = await api.get('/users/my-team');
  return response.data;
};

export const removeEmployee = async (employeeId) => {
  const response = await api.post('/users/remove-employee', { employeeId });
  return response.data;
};

// All Users - Password Management
export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.post('/users/change-password', { currentPassword, newPassword });
  return response.data;
};
