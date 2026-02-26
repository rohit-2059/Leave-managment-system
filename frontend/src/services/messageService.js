import api from './api';

// Send a message
export const sendMessage = async (receiverId, content) => {
  const response = await api.post('/messages', { receiverId, content });
  return response.data;
};

// Get conversation with a specific user
export const getConversation = async (userId) => {
  const response = await api.get(`/messages/conversation/${userId}`);
  return response.data;
};

// Get all conversations (list of contacts with last message)
export const getConversations = async () => {
  const response = await api.get('/messages/conversations');
  return response.data;
};

// Get contactable users
export const getContacts = async () => {
  const response = await api.get('/messages/contacts');
  return response.data;
};

// Get unread message count
export const getUnreadCount = async () => {
  const response = await api.get('/messages/unread-count');
  return response.data;
};
