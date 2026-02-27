import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faPaperPlane,
  faArrowLeft,
  faUser,
  faUserTie,
  faComments,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import {
  getContacts,
  getConversations,
  getConversation,
} from '../services/messageService';
import { useSocket } from '../context/useSocket';

const MessagingPanel = ({ isOpen, onClose }) => {
  const { socket, isOnline } = useSocket();
  const [view, setView] = useState('contacts'); // 'contacts' | 'chat'
  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchContactsAndConversations();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for real-time incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msg) => {
      // If we're in the chat with this sender, add the message and mark as read
      if (selectedUser && (msg.senderId._id === selectedUser._id || msg.senderId === selectedUser._id)) {
        setMessages((prev) => [...prev, msg]);
        // Mark as read immediately
        socket.emit('mark_read', { senderId: selectedUser._id });
      }
      // Refresh conversation list if on contacts view
      if (view === 'contacts') {
        fetchContactsAndConversations();
      }
    };

    const handleTyping = ({ userId: typerId, isTyping }) => {
      if (selectedUser && typerId === selectedUser._id) {
        setTypingUser(isTyping ? typerId : null);
      }
    };

    const handleMessagesRead = () => {
      // Could update read receipts in the UI
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleTyping);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleTyping);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, selectedUser, view]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchContactsAndConversations = async () => {
    setLoading(true);
    try {
      const [contactsRes, convsRes] = await Promise.all([
        getContacts(),
        getConversations(),
      ]);
      setContacts(contactsRes.contacts || []);
      setConversations(convsRes.conversations || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    setLoading(true);
    try {
      const res = await getConversation(userId);
      setMessages(res.messages || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const openChat = async (user) => {
    setSelectedUser(user);
    setView('chat');
    await fetchMessages(user._id);
    // Mark messages from this user as read
    if (socket) {
      socket.emit('mark_read', { senderId: user._id });
    }
  };

  const goBack = () => {
    setView('contacts');
    setSelectedUser(null);
    setMessages([]);
    setNewMessage('');
    setTypingUser(null);
    fetchContactsAndConversations();
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || sending || !socket) return;

    setSending(true);

    // Stop typing indicator
    socket.emit('typing', { receiverId: selectedUser._id, isTyping: false });

    socket.emit('send_message', {
      receiverId: selectedUser._id,
      content: newMessage.trim(),
    }, (response) => {
      if (response?.success) {
        setMessages((prev) => [...prev, response.message]);
        setNewMessage('');
      }
      setSending(false);
    });
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (!socket || !selectedUser) return;

    // Send typing indicator
    socket.emit('typing', { receiverId: selectedUser._id, isTyping: true });

    // Clear previous timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Stop typing after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { receiverId: selectedUser._id, isTyping: false });
    }, 2000);
  };

  const getUnreadForUser = (userId) => {
    const conv = conversations.find((c) => c.user._id === userId);
    return conv?.unreadCount || 0;
  };

  const getLastMessage = (userId) => {
    const conv = conversations.find((c) => c.user._id === userId);
    return conv?.lastMessage || null;
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Merge contacts with conversation data, sorted by recent activity
  const contactList = contacts.map((contact) => {
    const lastMsg = getLastMessage(contact._id);
    return { ...contact, lastMsg, unread: getUnreadForUser(contact._id) };
  }).sort((a, b) => {
    if (a.lastMsg && b.lastMsg) return new Date(b.lastMsg.createdAt) - new Date(a.lastMsg.createdAt);
    if (a.lastMsg) return -1;
    if (b.lastMsg) return 1;
    return a.name.localeCompare(b.name);
  });

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-screen w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-900 text-white">
          <div className="flex items-center gap-3">
            {view === 'chat' && (
              <button onClick={goBack} className="hover:bg-gray-800 p-1 rounded transition-colors">
                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
              </button>
            )}
            {view === 'contacts' ? (
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faComments} />
                <span className="font-semibold text-sm">Messages</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative">
                  {selectedUser?.avatar ? (
                    <img src={selectedUser.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center">
                      <FontAwesomeIcon
                        icon={selectedUser?.role === 'manager' ? faUserTie : selectedUser?.role === 'admin' ? faShieldHalved : faUser}
                        className="text-xs"
                      />
                    </div>
                  )}
                  {/* Online indicator */}
                  {selectedUser && isOnline(selectedUser._id) && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-gray-900" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">{selectedUser?.name}</p>
                  <p className="text-[10px] text-gray-300">
                    {typingUser ? (
                      <span className="text-green-300">typing...</span>
                    ) : selectedUser && isOnline(selectedUser._id) ? (
                      'Online'
                    ) : (
                      selectedUser?.role?.toUpperCase()
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="hover:bg-gray-800 p-1.5 rounded transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} className="text-lg" />
          </button>
        </div>

        {/* Body */}
        {view === 'contacts' ? (
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-3 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : contactList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <FontAwesomeIcon icon={faComments} className="text-3xl mb-2" />
                <p className="text-sm">No contacts available</p>
              </div>
            ) : (
              contactList.map((contact) => (
                <button
                  key={contact._id}
                  onClick={() => openChat(contact)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left"
                >
                  <div className="relative shrink-0">
                    {contact.avatar ? (
                      <img src={contact.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                        <FontAwesomeIcon
                          icon={contact.role === 'manager' ? faUserTie : contact.role === 'admin' ? faShieldHalved : faUser}
                          className="text-sm text-gray-500"
                        />
                      </div>
                    )}
                    {/* Online dot */}
                    {isOnline(contact._id) && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 truncate">{contact.name}</p>
                      {contact.lastMsg && (
                        <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                          {formatTime(contact.lastMsg.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 truncate">
                        {contact.lastMsg
                          ? contact.lastMsg.content
                          : contact.email}
                      </p>
                      {contact.unread > 0 && (
                        <span className="ml-2 shrink-0 bg-blue-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {contact.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-6 h-6 border-3 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <FontAwesomeIcon icon={faComments} className="text-3xl mb-2" />
                  <p className="text-sm">No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId._id === currentUser._id || msg.senderId === currentUser._id;
                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                          isMine
                            ? 'bg-gray-900 text-white rounded-br-sm'
                            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                        }`}
                      >
                        <p className="wrap-break-word">{msg.content}</p>
                        <p className="text-[10px] mt-1 text-gray-400">
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              {/* Typing indicator */}
              {typingUser && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-xl rounded-bl-sm px-3 py-2 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <span className="flex gap-0.5">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 bg-white"
            >
              <input
                type="text"
                value={newMessage}
                onChange={handleInputChange}
                placeholder="Type a message..."
                maxLength={1000}
                className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="bg-gray-900 text-white p-2.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon icon={faPaperPlane} className="text-sm" />
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
};

export default MessagingPanel;
