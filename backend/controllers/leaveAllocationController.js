import LeaveAllocation from '../models/LeaveAllocation.js';
import User from '../models/User.js';

// @desc    Admin - Set leave allocation for an employee
// @route   POST /api/leave-allocations
// @access  Admin only
export const setLeaveAllocation = async (req, res) => {
  try {
    const { employeeId, totalLeaves } = req.body;

    if (!employeeId || totalLeaves === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide employeeId and totalLeaves',
      });
    }

    const employee = await User.findById(employeeId);
    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const allocation = await LeaveAllocation.findOneAndUpdate(
      { employeeId },
      { totalLeaves },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: `Leave allocation set to ${totalLeaves} days for ${employee.name}`,
      allocation,
    });
  } catch (error) {
    console.error('Set leave allocation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting leave allocation',
    });
  }
};

// @desc    Admin - Get all leave allocations
// @route   GET /api/leave-allocations
// @access  Admin only
export const getAllLeaveAllocations = async (req, res) => {
  try {
    const allocations = await LeaveAllocation.find()
      .populate('employeeId', 'name email avatar')
      .sort({ createdAt: -1 });

    // Also get employees without allocations
    const allocatedIds = allocations.map((a) => a.employeeId?._id?.toString());
    const unallocatedEmployees = await User.find({
      role: 'employee',
      _id: { $nin: allocatedIds },
    }).select('name email avatar');

    res.status(200).json({
      success: true,
      allocations,
      unallocatedEmployees,
    });
  } catch (error) {
    console.error('Get leave allocations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave allocations',
    });
  }
};

// @desc    Admin - Update leave allocation
// @route   PUT /api/leave-allocations/:allocationId
// @access  Admin only
export const updateLeaveAllocation = async (req, res) => {
  try {
    const { allocationId } = req.params;
    const { totalLeaves } = req.body;

    if (totalLeaves === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide totalLeaves',
      });
    }

    const allocation = await LeaveAllocation.findById(allocationId);
    if (!allocation) {
      return res.status(404).json({
        success: false,
        message: 'Leave allocation not found',
      });
    }

    if (totalLeaves < allocation.leavesTaken) {
      return res.status(400).json({
        success: false,
        message: `Cannot set total leaves below already taken (${allocation.leavesTaken})`,
      });
    }

    allocation.totalLeaves = totalLeaves;
    await allocation.save();

    await allocation.populate('employeeId', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Leave allocation updated successfully',
      allocation,
    });
  } catch (error) {
    console.error('Update leave allocation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating leave allocation',
    });
  }
};
