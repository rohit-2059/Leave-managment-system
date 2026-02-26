import { Router } from 'express';
import {
  createManager,
  createEmployee,
  getAllManagers,
  getAllEmployees,
  getAllUsers,
  getAdminOverview,
  deleteUser,
  getUnassignedEmployees,
  assignEmployee,
  getMyTeam,
  removeEmployee,
  changePassword,
  updateProfile,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = Router();

// Admin routes - user management
router.post('/create-manager', protect, authorize('admin'), createManager);
router.post('/create-employee', protect, authorize('admin'), createEmployee);
router.get('/managers', protect, authorize('admin'), getAllManagers);
router.get('/employees', protect, authorize('admin', 'manager'), getAllEmployees); // Managers need access to add team members
router.get('/all', protect, authorize('admin'), getAllUsers);
router.get('/admin-overview', protect, authorize('admin'), getAdminOverview);
router.delete('/:userId', protect, authorize('admin'), deleteUser);

// Manager routes - team management
router.get('/unassigned-employees', protect, authorize('manager'), getUnassignedEmployees);
router.post('/assign-employee', protect, authorize('manager'), assignEmployee);
router.get('/my-team', protect, authorize('manager'), getMyTeam);
router.post('/remove-employee', protect, authorize('manager'), removeEmployee);

// All authenticated users - profile & password management
router.put('/profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);

export default router;
