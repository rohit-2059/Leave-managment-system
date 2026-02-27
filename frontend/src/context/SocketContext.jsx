import { useEffect, useState, useCallback, useSyncExternalStore } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SocketContext } from './socketContextDef';

// Simple external store for the socket instance to avoid setState-in-effect issues
let _socket = null;
let _listeners = new Set();

function getSocket() {
  return _socket;
}

function subscribeSocket(listener) {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

function setExternalSocket(s) {
  _socket = s;
  _listeners.forEach((l) => l());
}

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const socket = useSyncExternalStore(subscribeSocket, getSocket);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Connect for employee/manager/admin roles
    if (!user || !token || !['employee', 'manager', 'admin'].includes(user.role)) {
      return;
    }

    // Connect through same origin (Vite proxy handles forwarding to backend)
    const newSocket = io({
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 30000,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      newSocket.emit('get_unread_count');
      setExternalSocket(newSocket);
    });

    newSocket.on('online_users', (users) => {
      setOnlineUsers(users);
    });

    newSocket.on('user_online', ({ userId }) => {
      setOnlineUsers((prev) => {
        if (!prev.includes(userId)) return [...prev, userId];
        return prev;
      });
    });

    newSocket.on('user_offline', ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    newSocket.on('unread_count', (count) => {
      setUnreadCount(count);
    });

    newSocket.on('receive_message', () => {
      // Unread count is updated separately via unread_count event
    });

    newSocket.on('disconnect', () => {
      setExternalSocket(null);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    // Don't set socket until connected — the 'connect' handler above does it

    return () => {
      newSocket.disconnect();
      setExternalSocket(null);
    };
  }, [user, token]);

  const isOnline = useCallback(
    (userId) => onlineUsers.includes(userId),
    [onlineUsers]
  );

  const value = {
    socket,
    onlineUsers,
    unreadCount,
    setUnreadCount,
    isOnline,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
