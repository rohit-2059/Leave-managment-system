import express from 'express';
import {
  setLeaveAllocation,
  getAllLeaveAllocations,
  updateLeaveAllocation,
} from '../controllers/leaveAllocationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.route('/').post(setLeaveAllocation).get(getAllLeaveAllocations);
router.put('/:allocationId', updateLeaveAllocation);

export default router;
