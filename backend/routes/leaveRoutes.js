import express from 'express';
import {
  applyLeave,
  getMyLeaves,
  getMyLeaveBalance,
  getTeamLeaveRequests,
  reviewLeaveRequest,
  withdrawLeave,
} from '../controllers/leaveController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Employee routes
router.post('/', protect, authorize('employee'), applyLeave);
router.get('/my', protect, authorize('employee'), getMyLeaves);
router.get('/balance', protect, authorize('employee'), getMyLeaveBalance);
router.put('/:leaveId/withdraw', protect, authorize('employee'), withdrawLeave);

// Manager routes
router.get('/team', protect, authorize('manager'), getTeamLeaveRequests);
router.put('/:leaveId/review', protect, authorize('manager'), reviewLeaveRequest);

export default router;
