import api from './api';

// Create a new team
export const createTeam = async (name, description) => {
  const response = await api.post('/teams', { name, description });
  return response.data;
};

// Get all teams for the logged-in manager
export const getMyTeams = async () => {
  const response = await api.get('/teams');
  return response.data;
};

// Get specific team details
export const getTeamById = async (teamId) => {
  const response = await api.get(`/teams/${teamId}`);
  return response.data;
};

// Add member to team
export const addMemberToTeam = async (teamId, employeeId) => {
  const response = await api.post(`/teams/${teamId}/members`, { employeeId });
  return response.data;
};

// Remove member from team
export const removeMemberFromTeam = async (teamId, employeeId) => {
  const response = await api.delete(`/teams/${teamId}/members/${employeeId}`);
  return response.data;
};

// Update team details
export const updateTeam = async (teamId, name, description) => {
  const response = await api.put(`/teams/${teamId}`, { name, description });
  return response.data;
};

// Delete team
export const deleteTeam = async (teamId) => {
  const response = await api.delete(`/teams/${teamId}`);
  return response.data;
};

// Get manager dashboard overview (single optimized endpoint)
export const getManagerOverview = async () => {
  const response = await api.get('/teams/overview');
  return response.data;
};
