import Complaint from '../models/Complaint.js';
import Team from '../models/Team.js';

// @desc    Employee - Raise a complaint
// @route   POST /api/complaints
// @access  Employee only
export const raiseComplaint = async (req, res) => {
  try {
    const { subject, description, category } = req.body;
    const employeeId = req.user.userId;

    if (!subject || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide subject, description, and category',
      });
    }

    const complaint = await Complaint.create({
      employeeId,
      subject: subject.trim(),
      description: description.trim(),
      category,
    });

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint,
    });
  } catch (error) {
    console.error('Raise complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting complaint',
    });
  }
};

// @desc    Employee - Get my complaints
// @route   GET /api/complaints/my
// @access  Employee only
export const getMyComplaints = async (req, res) => {
  try {
    const employeeId = req.user.userId;
    const { status } = req.query;

    const filter = { employeeId };
    if (status && ['pending', 'accepted', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const complaints = await Complaint.find(filter)
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error('Get my complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching complaints',
    });
  }
};

// @desc    Manager - Get complaints from team members
// @route   GET /api/complaints/team
// @access  Manager only
export const getTeamComplaints = async (req, res) => {
  try {
    const managerId = req.user.userId;
    const { status } = req.query;

    // Get all team members across all manager's teams
    const teams = await Team.find({ managerId });
    const memberIds = [...new Set(teams.flatMap((t) => t.members.map((m) => m.toString())))];

    if (memberIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        complaints: [],
      });
    }

    const filter = { employeeId: { $in: memberIds } };
    if (status && ['pending', 'accepted', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const complaints = await Complaint.find(filter)
      .populate('employeeId', 'name email avatar')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error('Get team complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching team complaints',
    });
  }
};

// @desc    Manager - Review complaint (accept/reject)
// @route   PUT /api/complaints/:complaintId/review
// @access  Manager only
export const reviewComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status, managerNote } = req.body;
    const managerId = req.user.userId;

    if (!status || !['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be accepted or rejected',
      });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    if (complaint.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Complaint has already been ${complaint.status}`,
      });
    }

    // Verify the employee is in manager's team
    const teams = await Team.find({ managerId });
    const memberIds = teams.flatMap((t) => t.members.map((m) => m.toString()));
    if (!memberIds.includes(complaint.employeeId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'This employee is not in your team',
      });
    }

    complaint.status = status;
    complaint.managerNote = managerNote?.trim() || '';
    complaint.reviewedBy = managerId;
    complaint.reviewedAt = new Date();
    await complaint.save();

    await complaint.populate('employeeId', 'name email avatar');
    await complaint.populate('reviewedBy', 'name email');

    res.status(200).json({
      success: true,
      message: `Complaint ${status} successfully`,
      complaint,
    });
  } catch (error) {
    console.error('Review complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reviewing complaint',
    });
  }
};

// @desc    Employee - Withdraw a complaint
// @route   PUT /api/complaints/:complaintId/withdraw
// @access  Employee only
export const withdrawComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const employeeId = req.user.userId;

    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    if (complaint.employeeId.toString() !== employeeId) {
      return res.status(403).json({
        success: false,
        message: 'You can only withdraw your own complaints',
      });
    }

    if (complaint.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending complaints can be withdrawn',
      });
    }

    complaint.status = 'withdrawn';
    await complaint.save();

    res.status(200).json({
      success: true,
      message: 'Complaint withdrawn successfully',
      complaint,
    });
  } catch (error) {
    console.error('Withdraw complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Error withdrawing complaint',
    });
  }
};
