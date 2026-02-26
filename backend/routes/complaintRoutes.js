import express from 'express';
import {
  raiseComplaint,
  getMyComplaints,
  getTeamComplaints,
  reviewComplaint,
  withdrawComplaint,
} from '../controllers/complaintController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Employee routes
router.post('/', protect, authorize('employee'), raiseComplaint);
router.get('/my', protect, authorize('employee'), getMyComplaints);
router.put('/:complaintId/withdraw', protect, authorize('employee'), withdrawComplaint);

// Manager routes
router.get('/team', protect, authorize('manager'), getTeamComplaints);
router.put('/:complaintId/review', protect, authorize('manager'), reviewComplaint);

export default router;
