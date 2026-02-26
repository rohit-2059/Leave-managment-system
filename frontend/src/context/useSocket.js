import { useContext } from 'react';
import { SocketContext } from './socketContextDef';

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    return { socket: null, onlineUsers: [], unreadCount: 0, setUnreadCount: () => {}, isOnline: () => false };
  }
  return context;
};
