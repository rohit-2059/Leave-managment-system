import express from 'express';
import {
  sendMessage,
  getConversation,
  getConversations,
  getContacts,
  getUnreadCount,
} from '../controllers/messageController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication and employee/manager role
router.use(protect);
router.use(authorize('employee', 'manager'));

router.post('/', sendMessage);
router.get('/conversations', getConversations);
router.get('/contacts', getContacts);
router.get('/unread-count', getUnreadCount);
router.get('/conversation/:userId', getConversation);

export default router;
