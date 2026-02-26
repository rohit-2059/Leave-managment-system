import express from 'express';
const router = express.Router();
import {
  createTeam,
  getMyTeams,
  getTeamById,
  addMemberToTeam,
  removeMemberFromTeam,
  updateTeam,
  deleteTeam,
  getManagerOverview,
} from '../controllers/teamController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

// All routes require authentication and manager role
router.use(protect);
router.use(authorize('manager'));

// Dashboard overview — must be before /:teamId
router.get('/overview', getManagerOverview);

// Team CRUD routes
router.route('/').post(createTeam).get(getMyTeams);

router
  .route('/:teamId')
  .get(getTeamById)
  .put(updateTeam)
  .delete(deleteTeam);

// Team members routes
router.post('/:teamId/members', addMemberToTeam);
router.delete('/:teamId/members/:employeeId', removeMemberFromTeam);

export default router;
