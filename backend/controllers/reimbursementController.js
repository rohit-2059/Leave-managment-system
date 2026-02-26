import Reimbursement from '../models/Reimbursement.js';
import Team from '../models/Team.js';

// ───────────────────────────── Employee / Manager: Apply ─────────────────────────────

// @desc    Apply for reimbursement (employee or manager)
// @route   POST /api/reimbursements
// @access  Employee, Manager
export const applyReimbursement = async (req, res) => {
  try {
    const { title, description, amount, category } = req.body;
    const { userId, role } = req.user;

    if (!title || !description || !amount || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, amount, and category',
      });
    }

    if (Number(amount) < 1) {
      return res.status(400).json({ success: false, message: 'Amount must be at least 1' });
    }

    const reimbursement = await Reimbursement.create({
      applicantId: userId,
      applicantRole: role,
      title: title.trim(),
      description: description.trim(),
      amount: Number(amount),
      category,
    });

    res.status(201).json({
      success: true,
      message: 'Reimbursement request submitted successfully',
      reimbursement,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ───────────────────────────── My Reimbursements ─────────────────────────────

// @desc    Get my reimbursements
// @route   GET /api/reimbursements/my
// @access  Employee, Manager
export const getMyReimbursements = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { applicantId: req.user.userId };
    if (status) filter.status = status;

    const reimbursements = await Reimbursement.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, reimbursements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ───────────────────────────── Withdraw ─────────────────────────────

// @desc    Withdraw a reimbursement (only if still pending)
// @route   PUT /api/reimbursements/:id/withdraw
// @access  Employee, Manager
export const withdrawReimbursement = async (req, res) => {
  try {
    const reimbursement = await Reimbursement.findById(req.params.id);

    if (!reimbursement) {
      return res.status(404).json({ success: false, message: 'Reimbursement not found' });
    }

    if (reimbursement.applicantId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Not your reimbursement' });
    }

    if (reimbursement.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only withdraw pending reimbursements',
      });
    }

    reimbursement.status = 'withdrawn';
    await reimbursement.save();

    res.json({ success: true, message: 'Reimbursement withdrawn', reimbursement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ───────────────────────────── Manager: Review employee reimbursements ─────────────────────────────

// @desc    Get team employee reimbursements (pending ones for manager approval)
// @route   GET /api/reimbursements/team
// @access  Manager
export const getTeamReimbursements = async (req, res) => {
  try {
    const managerId = req.user.userId;
    const { status } = req.query;

    // Get all teams managed by this manager
    const teams = await Team.find({ managerId }).select('members').lean();
    const memberIds = teams.flatMap((t) => t.members.map((m) => m.toString()));
    const uniqueMemberIds = [...new Set(memberIds)];

    if (uniqueMemberIds.length === 0) {
      return res.json({ success: true, reimbursements: [] });
    }

    const filter = {
      applicantId: { $in: uniqueMemberIds },
      applicantRole: 'employee',
    };
    if (status) {
      filter.status = status;
    } else {
      // By default show pending ones for the manager to review
      filter.status = 'pending';
    }

    const reimbursements = await Reimbursement.find(filter)
      .populate('applicantId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, reimbursements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Manager approves/rejects an employee reimbursement
// @route   PUT /api/reimbursements/:id/manager-review
// @access  Manager
export const managerReviewReimbursement = async (req, res) => {
  try {
    const { status, note } = req.body;
    const managerId = req.user.userId;

    if (!['manager_approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be manager_approved or rejected',
      });
    }

    const reimbursement = await Reimbursement.findById(req.params.id);

    if (!reimbursement) {
      return res.status(404).json({ success: false, message: 'Reimbursement not found' });
    }

    if (reimbursement.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only review pending reimbursements',
      });
    }

    if (reimbursement.applicantRole !== 'employee') {
      return res.status(400).json({
        success: false,
        message: 'Managers can only review employee reimbursements',
      });
    }

    // Verify the employee belongs to one of this manager's teams
    const teams = await Team.find({ managerId }).select('members').lean();
    const memberIds = teams.flatMap((t) => t.members.map((m) => m.toString()));
    if (!memberIds.includes(reimbursement.applicantId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'This employee is not in your team',
      });
    }

    reimbursement.status = status;
    reimbursement.managerReviewedBy = managerId;
    reimbursement.managerReviewedAt = new Date();
    reimbursement.managerNote = note?.trim() || '';
    await reimbursement.save();

    const actionText = status === 'manager_approved' ? 'approved (forwarded to admin)' : 'rejected';

    res.json({
      success: true,
      message: `Reimbursement ${actionText}`,
      reimbursement,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ───────────────────────────── Admin: Review all reimbursements ─────────────────────────────

// @desc    Get all reimbursements pending admin approval
// @route   GET /api/reimbursements/admin
// @access  Admin
export const getAdminReimbursements = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};

    if (status) {
      filter.status = status;
    } else {
      // By default show:
      // - manager_approved employee ones (waiting for admin final approval)
      // - pending manager ones (only need admin approval)
      filter.$or = [
        { applicantRole: 'employee', status: 'manager_approved' },
        { applicantRole: 'manager', status: 'pending' },
      ];
    }

    const reimbursements = await Reimbursement.find(filter)
      .populate('applicantId', 'name email role')
      .populate('managerReviewedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, reimbursements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin approves/rejects a reimbursement (final step)
// @route   PUT /api/reimbursements/:id/admin-review
// @access  Admin
export const adminReviewReimbursement = async (req, res) => {
  try {
    const { status, note } = req.body;
    const adminId = req.user.userId;

    if (!['admin_approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be admin_approved or rejected',
      });
    }

    const reimbursement = await Reimbursement.findById(req.params.id);

    if (!reimbursement) {
      return res.status(404).json({ success: false, message: 'Reimbursement not found' });
    }

    // Employee reimbursements must be manager_approved first
    if (reimbursement.applicantRole === 'employee' && reimbursement.status !== 'manager_approved') {
      return res.status(400).json({
        success: false,
        message: 'Employee reimbursement must be approved by manager first',
      });
    }

    // Manager reimbursements must be pending
    if (reimbursement.applicantRole === 'manager' && reimbursement.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only review pending manager reimbursements',
      });
    }

    reimbursement.status = status;
    reimbursement.adminReviewedBy = adminId;
    reimbursement.adminReviewedAt = new Date();
    reimbursement.adminNote = note?.trim() || '';
    await reimbursement.save();

    const actionText = status === 'admin_approved' ? 'approved' : 'rejected';

    res.json({
      success: true,
      message: `Reimbursement ${actionText}`,
      reimbursement,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
