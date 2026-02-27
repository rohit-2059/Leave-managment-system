import Message from '../models/Message.js';
import User from '../models/User.js';
import Team from '../models/Team.js';

// @desc    Send a message
// @route   POST /api/messages
// @access  Employee, Manager, Admin
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.userId;
    const senderRole = req.user.role;

    if (!receiverId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide receiverId and content',
      });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found',
      });
    }

    // Employee can only message managers
    if (senderRole === 'employee' && receiver.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Employees can only message managers',
      });
    }

    // Manager can message employees in their teams OR admins
    if (senderRole === 'manager') {
      if (receiver.role === 'employee') {
        const teams = await Team.find({ managerId: senderId });
        const allMembers = teams.flatMap((t) => t.members.map((m) => m.toString()));
        if (!allMembers.includes(receiverId)) {
          return res.status(403).json({
            success: false,
            message: 'You can only message employees in your teams',
          });
        }
      } else if (receiver.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Managers can only message employees in their teams or admins',
        });
      }
    }

    // Admin can only message managers
    if (senderRole === 'admin' && receiver.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Admins can only message managers',
      });
    }

    const message = await Message.create({
      senderId,
      receiverId,
      content: content.trim(),
    });

    const populated = await Message.findById(message._id)
      .populate('senderId', 'name email avatar role')
      .populate('receiverId', 'name email avatar role');

    res.status(201).json({
      success: true,
      message: populated,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
    });
  }
};

// @desc    Get conversation with a specific user
// @route   GET /api/messages/conversation/:userId
// @access  Employee, Manager, Admin
export const getConversation = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId },
      ],
    })
      .populate('senderId', 'name email avatar role')
      .populate('receiverId', 'name email avatar role')
      .sort({ createdAt: 1 });

    // Mark messages from the other user as read
    await Message.updateMany(
      { senderId: userId, receiverId: currentUserId, read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversation',
    });
  }
};

// @desc    Get list of conversations (contacts with last message)
// @route   GET /api/messages/conversations
// @access  Employee, Manager, Admin
export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user.userId;

    // Get all messages involving the current user
    const messages = await Message.find({
      $or: [{ senderId: currentUserId }, { receiverId: currentUserId }],
    })
      .populate('senderId', 'name email avatar role')
      .populate('receiverId', 'name email avatar role')
      .sort({ createdAt: -1 });

    // Group by the other user and pick the latest message
    const conversationMap = new Map();
    for (const msg of messages) {
      const otherUser =
        msg.senderId._id.toString() === currentUserId
          ? msg.receiverId
          : msg.senderId;
      const otherUserId = otherUser._id.toString();

      if (!conversationMap.has(otherUserId)) {
        const unreadCount = await Message.countDocuments({
          senderId: otherUserId,
          receiverId: currentUserId,
          read: false,
        });
        conversationMap.set(otherUserId, {
          user: otherUser,
          lastMessage: msg,
          unreadCount,
        });
      }
    }

    const conversations = Array.from(conversationMap.values());

    res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations',
    });
  }
};

// @desc    Get contactable users (managers for employee, team employees + admins for manager, managers for admin)
// @route   GET /api/messages/contacts
// @access  Employee, Manager, Admin
export const getContacts = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const currentRole = req.user.role;

    let contacts = [];

    if (currentRole === 'employee') {
      // Employee can message any manager
      contacts = await User.find({ role: 'manager' }).select('name email avatar role');
    } else if (currentRole === 'manager') {
      // Manager can message employees in their teams + all admins
      const teams = await Team.find({ managerId: currentUserId }).populate(
        'members',
        'name email avatar role'
      );
      const memberMap = new Map();
      for (const team of teams) {
        for (const member of team.members) {
          memberMap.set(member._id.toString(), member);
        }
      }
      const teamEmployees = Array.from(memberMap.values());
      const admins = await User.find({ role: 'admin' }).select('name email avatar role');
      contacts = [...teamEmployees, ...admins];
    } else if (currentRole === 'admin') {
      // Admin can message any manager
      contacts = await User.find({ role: 'manager' }).select('name email avatar role');
    }

    res.status(200).json({
      success: true,
      contacts,
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contacts',
    });
  }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread-count
// @access  Employee, Manager, Admin
export const getUnreadCount = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const count = await Message.countDocuments({
      receiverId: currentUserId,
      read: false,
    });

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count',
    });
  }
};
