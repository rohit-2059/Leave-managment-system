import Leave from '../models/Leave.js';
import LeaveAllocation from '../models/LeaveAllocation.js';
import Team from '../models/Team.js';

// @desc    Employee - Apply for leave
// @route   POST /api/leaves
// @access  Employee only
export const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const employeeId = req.user.userId;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be before start date',
      });
    }

    const numberOfDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Check leave allocation
    const allocation = await LeaveAllocation.findOne({ employeeId });
    if (allocation) {
      const remaining = allocation.totalLeaves - allocation.leavesTaken;
      if (leaveType !== 'unpaid' && numberOfDays > remaining) {
        return res.status(400).json({
          success: false,
          message: `Insufficient leave balance. You have ${remaining} days remaining.`,
        });
      }
    }

    const leave = await Leave.create({
      employeeId,
      leaveType,
      startDate: start,
      endDate: end,
      reason: reason.trim(),
    });

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      leave,
    });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting leave request',
    });
  }
};

// @desc    Employee - Get my leaves
// @route   GET /api/leaves/my
// @access  Employee only
export const getMyLeaves = async (req, res) => {
  try {
    const employeeId = req.user.userId;
    const { status } = req.query;

    const filter = { employeeId };
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const leaves = await Leave.find(filter)
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leaves.length,
      leaves,
    });
  } catch (error) {
    console.error('Get my leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaves',
    });
  }
};

// @desc    Employee - Get my leave balance
// @route   GET /api/leaves/balance
// @access  Employee only
export const getMyLeaveBalance = async (req, res) => {
  try {
    const employeeId = req.user.userId;

    let allocation = await LeaveAllocation.findOne({ employeeId });

    if (!allocation) {
      allocation = {
        totalLeaves: 0,
        leavesTaken: 0,
        leavesRemaining: 0,
      };
    }

    // Count pending leaves
    const pendingCount = await Leave.countDocuments({
      employeeId,
      status: 'pending',
    });

    res.status(200).json({
      success: true,
      balance: {
        totalLeaves: allocation.totalLeaves,
        leavesTaken: allocation.leavesTaken,
        leavesRemaining: allocation.totalLeaves - allocation.leavesTaken,
        pendingRequests: pendingCount,
      },
    });
  } catch (error) {
    console.error('Get leave balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave balance',
    });
  }
};

// @desc    Manager - Get leave requests from team members
// @route   GET /api/leaves/team
// @access  Manager only
export const getTeamLeaveRequests = async (req, res) => {
  try {
    const managerId = req.user.userId;
    const { status, employeeId } = req.query;

    // Get all team members across all manager's teams
    const teams = await Team.find({ managerId });
    const memberIds = [...new Set(teams.flatMap((t) => t.members.map((m) => m.toString())))];

    if (memberIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        leaves: [],
      });
    }

    const filter = { employeeId: { $in: memberIds } };
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }
    if (employeeId) {
      filter.employeeId = employeeId;
    }

    const leaves = await Leave.find(filter)
      .populate('employeeId', 'name email avatar')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leaves.length,
      leaves,
    });
  } catch (error) {
    console.error('Get team leave requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching team leave requests',
    });
  }
};

// @desc    Manager - Review leave request (approve/reject)
// @route   PUT /api/leaves/:leaveId/review
// @access  Manager only
export const reviewLeaveRequest = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { status, managerNote } = req.body;
    const managerId = req.user.userId;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be approved or rejected',
      });
    }

    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Leave request has already been ${leave.status}`,
      });
    }

    // Verify the employee is in manager's team
    const teams = await Team.find({ managerId });
    const memberIds = teams.flatMap((t) => t.members.map((m) => m.toString()));
    if (!memberIds.includes(leave.employeeId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'This employee is not in your team',
      });
    }

    leave.status = status;
    leave.managerNote = managerNote?.trim() || '';
    leave.reviewedBy = managerId;
    leave.reviewedAt = new Date();
    await leave.save();

    // Update leave allocation if approved
    if (status === 'approved' && leave.leaveType !== 'unpaid') {
      await LeaveAllocation.findOneAndUpdate(
        { employeeId: leave.employeeId },
        { $inc: { leavesTaken: leave.numberOfDays } }
      );
    }

    await leave.populate('employeeId', 'name email avatar');
    await leave.populate('reviewedBy', 'name email');

    res.status(200).json({
      success: true,
      message: `Leave request ${status} successfully`,
      leave,
    });
  } catch (error) {
    console.error('Review leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reviewing leave request',
    });
  }
};

// @desc    Employee - Withdraw a leave request
// @route   PUT /api/leaves/:leaveId/withdraw
// @access  Employee only
export const withdrawLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const employeeId = req.user.userId;

    const leave = await Leave.findById(leaveId);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
      });
    }

    if (leave.employeeId.toString() !== employeeId) {
      return res.status(403).json({
        success: false,
        message: 'You can only withdraw your own leave requests',
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending leave requests can be withdrawn',
      });
    }

    leave.status = 'withdrawn';
    await leave.save();

    res.status(200).json({
      success: true,
      message: 'Leave request withdrawn successfully',
      leave,
    });
  } catch (error) {
    console.error('Withdraw leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Error withdrawing leave request',
    });
  }
};
