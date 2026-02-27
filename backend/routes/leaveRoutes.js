import express from 'express';
import {
  applyLeave,
  getMyLeaves,
  getMyLeaveBalance,
  getTeamLeaveRequests,
  reviewLeaveRequest,
  withdrawLeave,
  getManagerLeaveRequests,
  adminReviewLeave,
  getEscalatedLeaves,
  overrideLeaveRejection,
} from '../controllers/leaveController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Employee & Manager routes (both can apply, view, and withdraw leaves)
router.post('/', protect, authorize('employee', 'manager'), applyLeave);
router.get('/my', protect, authorize('employee', 'manager'), getMyLeaves);
router.get('/balance', protect, authorize('employee', 'manager'), getMyLeaveBalance);
router.put('/:leaveId/withdraw', protect, authorize('employee', 'manager'), withdrawLeave);

// Manager routes (team management)
router.get('/team', protect, authorize('manager'), getTeamLeaveRequests);
router.put('/:leaveId/review', protect, authorize('manager'), reviewLeaveRequest);

// Admin routes (review manager leaves & handle escalations)
router.get('/manager-requests', protect, authorize('admin'), getManagerLeaveRequests);
router.put('/:leaveId/admin-review', protect, authorize('admin'), adminReviewLeave);
router.get('/escalated', protect, authorize('admin'), getEscalatedLeaves);
router.put('/:leaveId/override', protect, authorize('admin'), overrideLeaveRejection);

export default router;
