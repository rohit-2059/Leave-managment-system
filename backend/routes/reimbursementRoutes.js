import express from 'express';
import {
  applyReimbursement,
  getMyReimbursements,
  withdrawReimbursement,
  getTeamReimbursements,
  managerReviewReimbursement,
  getAdminReimbursements,
  adminReviewReimbursement,
} from '../controllers/reimbursementController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Employee & Manager: apply + view own + withdraw
router.post('/', protect, authorize('employee', 'manager'), applyReimbursement);
router.get('/my', protect, authorize('employee', 'manager'), getMyReimbursements);
router.put('/:id/withdraw', protect, authorize('employee', 'manager'), withdrawReimbursement);

// Manager: review team employee reimbursements
router.get('/team', protect, authorize('manager'), getTeamReimbursements);
router.put('/:id/manager-review', protect, authorize('manager'), managerReviewReimbursement);

// Admin: view & review all reimbursements
router.get('/admin', protect, authorize('admin'), getAdminReimbursements);
router.put('/:id/admin-review', protect, authorize('admin'), adminReviewReimbursement);

export default router;
