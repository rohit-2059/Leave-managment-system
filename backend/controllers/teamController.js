import Team from '../models/Team.js';
import User from '../models/User.js';
import Leave from '../models/Leave.js';
import Complaint from '../models/Complaint.js';

// @desc    Create a new team
// @route   POST /api/teams
// @access  Manager only
export const createTeam = async (req, res) => {
  try {
    const { name, description } = req.body;
    const managerId = req.user.userId;

    // Validate input
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Team name must be at least 2 characters',
      });
    }

    // Check if team name already exists for this manager
    const existingTeam = await Team.findOne({ managerId, name: name.trim() });
    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'You already have a team with this name',
      });
    }

    // Create team
    const team = await Team.create({
      name: name.trim(),
      description: description?.trim() || '',
      managerId,
      members: [],
    });

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      team,
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating team',
    });
  }
};

// @desc    Get all teams created by manager
// @route   GET /api/teams
// @access  Manager only
export const getMyTeams = async (req, res) => {
  try {
    const managerId = req.user.userId;

    const teams = await Team.find({ managerId })
      .populate('members', 'name email avatar authProvider role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: teams.length,
      teams,
    });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching teams',
    });
  }
};

// @desc    Get single team details
// @route   GET /api/teams/:teamId
// @access  Manager only (own teams)
export const getTeamById = async (req, res) => {
  try {
    const { teamId } = req.params;
    const managerId = req.user.userId;

    const team = await Team.findOne({ _id: teamId, managerId }).populate(
      'members',
      'name email avatar authProvider role createdAt'
    );

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    res.status(200).json({
      success: true,
      team,
    });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching team',
    });
  }
};

// @desc    Add member to team
// @route   POST /api/teams/:teamId/members
// @access  Manager only (own teams)
export const addMemberToTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { employeeId } = req.body;
    const managerId = req.user.userId;

    // Validate employee ID
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required',
      });
    }

    // Find team and verify ownership
    const team = await Team.findOne({ _id: teamId, managerId });
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    // Check if employee exists and is an employee
    const employee = await User.findById(employeeId);
    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Check if employee is already in team
    if (team.members.includes(employeeId)) {
      return res.status(400).json({
        success: false,
        message: `${employee.name} is already in this team`,
      });
    }

    // Add member to team
    team.members.push(employeeId);
    await team.save();

    // Populate and return updated team
    await team.populate('members', 'name email avatar authProvider role');

    res.status(200).json({
      success: true,
      message: `${employee.name} added to team successfully`,
      team,
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding member',
    });
  }
};

// @desc    Remove member from team
// @route   DELETE /api/teams/:teamId/members/:employeeId
// @access  Manager only (own teams)
export const removeMemberFromTeam = async (req, res) => {
  try {
    const { teamId, employeeId } = req.params;
    const managerId = req.user.userId;

    // Find team and verify ownership
    const team = await Team.findOne({ _id: teamId, managerId });
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    // Check if employee is in team
    if (!team.members.includes(employeeId)) {
      return res.status(400).json({
        success: false,
        message: 'Employee is not in this team',
      });
    }

    // Remove member from team
    team.members = team.members.filter(
      (memberId) => memberId.toString() !== employeeId
    );
    await team.save();

    // Get employee name for response
    const employee = await User.findById(employeeId);

    // Populate and return updated team
    await team.populate('members', 'name email avatar authProvider role');

    res.status(200).json({
      success: true,
      message: `${employee?.name || 'Employee'} removed from team successfully`,
      team,
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing member',
    });
  }
};

// @desc    Update team details
// @route   PUT /api/teams/:teamId
// @access  Manager only (own teams)
export const updateTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { name, description } = req.body;
    const managerId = req.user.userId;

    // Find team and verify ownership
    const team = await Team.findOne({ _id: teamId, managerId });
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    // Validate name if provided
    if (name && name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Team name must be at least 2 characters',
      });
    }

    // Check if new name conflicts with existing team
    if (name && name.trim() !== team.name) {
      const existingTeam = await Team.findOne({
        managerId,
        name: name.trim(),
        _id: { $ne: teamId },
      });
      if (existingTeam) {
        return res.status(400).json({
          success: false,
          message: 'You already have a team with this name',
        });
      }
    }

    // Update team
    if (name) team.name = name.trim();
    if (description !== undefined) team.description = description.trim();
    await team.save();

    res.status(200).json({
      success: true,
      message: 'Team updated successfully',
      team,
    });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating team',
    });
  }
};

// @desc    Delete team
// @route   DELETE /api/teams/:teamId
// @access  Manager only (own teams)
export const deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const managerId = req.user.userId;

    // Find and delete team
    const team = await Team.findOneAndDelete({ _id: teamId, managerId });
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting team',
    });
  }
};

// In-memory cache for manager overview (short TTL to stay fresh)
const overviewCache = new Map();
const CACHE_TTL = 15_000; // 15 seconds

// @desc    Get manager dashboard overview (single fast endpoint)
// @route   GET /api/teams/overview
// @access  Manager only
export const getManagerOverview = async (req, res) => {
  try {
    const managerId = req.user.userId;

    // Check cache first
    const cached = overviewCache.get(managerId);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return res.status(200).json(cached.data);
    }

    // 1) Get teams (with lean + minimal populate)
    const teams = await Team.find({ managerId })
      .populate('members', 'name email avatar')
      .lean();

    const memberIds = [...new Set(teams.flatMap((t) => t.members.map((m) => m._id)))];
    const totalMembers = teams.reduce((sum, t) => sum + (t.members?.length || 0), 0);

    if (memberIds.length === 0) {
      const data = {
        success: true,
        stats: { teams: teams.length, totalMembers: 0, pendingLeaves: 0, approvedLeaves: 0, rejectedLeaves: 0, pendingComplaints: 0, acceptedComplaints: 0 },
        recentLeaves: [],
        recentComplaints: [],
      };
      overviewCache.set(managerId, { ts: Date.now(), data });
      return res.status(200).json(data);
    }

    // 2) Single combined aggregation — counts + recent items in ONE pipeline each
    //    Using $facet to get counts and recent docs in a single DB round-trip
    const [leaveResult, complaintResult] = await Promise.all([
      Leave.aggregate([
        { $match: { employeeId: { $in: memberIds } } },
        {
          $facet: {
            counts: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
            recent: [
              { $match: { status: 'pending' } },
              { $sort: { createdAt: -1 } },
              { $limit: 3 },
              {
                $lookup: {
                  from: 'users',
                  localField: 'employeeId',
                  foreignField: '_id',
                  pipeline: [{ $project: { name: 1, email: 1, avatar: 1 } }],
                  as: 'employeeId',
                },
              },
              { $unwind: { path: '$employeeId', preserveNullAndEmptyArrays: true } },
            ],
          },
        },
      ]),
      Complaint.aggregate([
        { $match: { employeeId: { $in: memberIds } } },
        {
          $facet: {
            counts: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
            recent: [
              { $match: { status: 'pending' } },
              { $sort: { createdAt: -1 } },
              { $limit: 3 },
              {
                $lookup: {
                  from: 'users',
                  localField: 'employeeId',
                  foreignField: '_id',
                  pipeline: [{ $project: { name: 1, email: 1, avatar: 1 } }],
                  as: 'employeeId',
                },
              },
              { $unwind: { path: '$employeeId', preserveNullAndEmptyArrays: true } },
            ],
          },
        },
      ]),
    ]);

    const leaveFacet = leaveResult[0] || { counts: [], recent: [] };
    const complaintFacet = complaintResult[0] || { counts: [], recent: [] };

    const leaveMap = Object.fromEntries(leaveFacet.counts.map((l) => [l._id, l.count]));
    const complaintMap = Object.fromEntries(complaintFacet.counts.map((c) => [c._id, c.count]));

    const data = {
      success: true,
      stats: {
        teams: teams.length,
        totalMembers,
        pendingLeaves: leaveMap.pending || 0,
        approvedLeaves: leaveMap.approved || 0,
        rejectedLeaves: leaveMap.rejected || 0,
        pendingComplaints: complaintMap.pending || 0,
        acceptedComplaints: complaintMap.accepted || 0,
      },
      recentLeaves: leaveFacet.recent,
      recentComplaints: complaintFacet.recent,
    };

    // Store in cache
    overviewCache.set(managerId, { ts: Date.now(), data });

    res.status(200).json(data);
  } catch (error) {
    console.error('Manager overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard overview',
    });
  }
};
