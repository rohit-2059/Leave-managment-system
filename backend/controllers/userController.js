import User from '../models/User.js';
import LeaveAllocation from '../models/LeaveAllocation.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Helper function to format user data before sending (remove sensitive fields)
const formatUser = (user) => {
  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};

// @desc    Admin - Create a manager account
// @route   POST /api/users/create-manager
// @access  Admin only
export const createManager = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, email, password)',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    // Create manager user
    const manager = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password, // Will be hashed by pre-save hook
      role: 'manager',
      authProvider: 'local',
    });

    const token = generateToken(manager);

    res.status(201).json({
      success: true,
      message: 'Manager account created successfully',
      token,
      user: formatUser(manager),
    });
  } catch (error) {
    console.error('Create manager error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating manager account',
    });
  }
};

// @desc    Admin - Create an employee account
// @route   POST /api/users/create-employee
// @access  Admin only
export const createEmployee = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, email, password)',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    // Create employee user
    const employee = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password, // Will be hashed by pre-save hook
      role: 'employee',
      authProvider: 'local',
    });

    const token = generateToken(employee);

    res.status(201).json({
      success: true,
      message: 'Employee account created successfully',
      token,
      user: formatUser(employee),
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating employee account',
    });
  }
};


// @desc    Admin - Get all managers
// @route   GET /api/users/managers
// @access  Admin only
export const getAllManagers = async (req, res) => {
  try {
    const managers = await User.find({ role: 'manager' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: managers.length,
      managers,
    });
  } catch (error) {
    console.error('Get managers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching managers',
    });
  }
};

// @desc    Admin - Get all employees
// @route   GET /api/users/employees
// @access  Admin only
export const getAllEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: employees.length,
      employees,
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
    });
  }
};

// @desc    Admin - Get all users
// @route   GET /api/users/all
// @access  Admin only
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
    });
  }
};

// In-memory cache for admin overview
const adminOverviewCache = { ts: 0, data: null };
const ADMIN_CACHE_TTL = 30_000; // 30 seconds

// @desc    Admin - Dashboard overview (single optimized endpoint)
// @route   GET /api/users/admin-overview
// @access  Admin only
export const getAdminOverview = async (req, res) => {
  try {
    // Check cache
    if (adminOverviewCache.data && Date.now() - adminOverviewCache.ts < ADMIN_CACHE_TTL) {
      return res.status(200).json(adminOverviewCache.data);
    }

    // TWO parallel aggregations — minimizes Atlas round-trips
    const [userResult, allocResult] = await Promise.all([
      // Single User aggregation with $facet: counts + recent 5 + employee IDs
      User.aggregate([
        {
          $facet: {
            counts: [{ $group: { _id: '$role', count: { $sum: 1 } } }],
            recent: [
              { $sort: { createdAt: -1 } },
              { $limit: 5 },
              { $project: { name: 1, email: 1, avatar: 1, role: 1, createdAt: 1 } },
            ],
            employeeIds: [
              { $match: { role: 'employee' } },
              { $project: { _id: 1 } },
            ],
          },
        },
      ]),
      // Single LeaveAllocation aggregation: count + allocated employee IDs
      LeaveAllocation.aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            ids: [{ $group: { _id: null, list: { $push: '$employeeId' } } }],
          },
        },
      ]),
    ]);

    const userFacet = userResult[0] || { counts: [], recent: [], employeeIds: [] };
    const allocFacet = allocResult[0] || { total: [], ids: [] };

    const roleMap = Object.fromEntries(userFacet.counts.map((r) => [r._id, r.count]));
    const totalUsers = Object.values(roleMap).reduce((s, c) => s + c, 0);
    const employeeCount = roleMap.employee || 0;
    const allocatedCount = allocFacet.total[0]?.count || 0;

    // Compute unallocated employees from the data we already have
    const allocatedIdSet = new Set((allocFacet.ids[0]?.list || []).map((id) => id.toString()));
    const allEmployeeIds = userFacet.employeeIds.map((e) => e._id);
    const unallocatedIds = allEmployeeIds.filter((id) => !allocatedIdSet.has(id.toString())).slice(0, 5);

    // Only fetch full user data for unallocated if there are any (1 more query at most)
    let unallocatedEmployees = [];
    if (unallocatedIds.length > 0) {
      unallocatedEmployees = await User.find({ _id: { $in: unallocatedIds } })
        .select('name email avatar')
        .lean();
    }

    const data = {
      success: true,
      stats: {
        totalUsers,
        admins: roleMap.admin || 0,
        managers: roleMap.manager || 0,
        employees: employeeCount,
        allocated: allocatedCount,
        unallocated: employeeCount - allocatedCount,
      },
      recentUsers: userFacet.recent,
      unallocatedEmployees,
    };

    adminOverviewCache.ts = Date.now();
    adminOverviewCache.data = data;

    res.status(200).json(data);
  } catch (error) {
    console.error('Admin overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin overview',
    });
  }
};

// @desc    Admin - Delete user
// @route   DELETE /api/users/:userId
// @access  Admin only
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
    });
  }
};

// @desc    Manager - Get unassigned employees (employees without a manager)
// @route   GET /api/users/unassigned-employees
// @access  Manager only
export const getUnassignedEmployees = async (req, res) => {
  try {
    // Find employees who don't have a manager assigned
    const employees = await User.find({
      role: 'employee',
      $or: [{ managerId: { $exists: false } }, { managerId: null }],
    })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: employees.length,
      employees,
    });
  } catch (error) {
    console.error('Get unassigned employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unassigned employees',
    });
  }
};

// @desc    Manager - Assign employee to themselves
// @route   POST /api/users/assign-employee
// @access  Manager only
export const assignEmployee = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const managerId = req.user.userId; // From JWT middleware

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide employee ID',
      });
    }

    // Find employee
    const employee = await User.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    if (employee.role !== 'employee') {
      return res.status(400).json({
        success: false,
        message: 'Selected user is not an employee',
      });
    }

    if (employee.managerId) {
      return res.status(400).json({
        success: false,
        message: 'This employee is already assigned to a manager',
      });
    }

    // Assign manager
    employee.managerId = managerId;
    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Employee assigned successfully',
      employee: formatUser(employee),
    });
  } catch (error) {
    console.error('Assign employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning employee',
    });
  }
};

// @desc    Manager - Get my team (employees assigned to this manager)
// @route   GET /api/users/my-team
// @access  Manager only
export const getMyTeam = async (req, res) => {
  try {
    const managerId = req.user.userId;

    const team = await User.find({
      role: 'employee',
      managerId: managerId,
    })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: team.length,
      team,
    });
  } catch (error) {
    console.error('Get my team error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching team',
    });
  }
};

// @desc    Manager - Remove employee from team
// @route   POST /api/users/remove-employee
// @access  Manager only
export const removeEmployee = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const managerId = req.user.userId;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide employee ID',
      });
    }

    const employee = await User.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    if (employee.managerId?.toString() !== managerId) {
      return res.status(403).json({
        success: false,
        message: 'This employee is not in your team',
      });
    }

    // Remove manager assignment
    employee.managerId = null;
    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Employee removed from team',
      employee: formatUser(employee),
    });
  } catch (error) {
    console.error('Remove employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing employee',
    });
  }
};

// @desc    Change current user's password
// @desc    Update user profile (name, avatar)
// @route   PUT /api/users/profile
// @access  All authenticated users
export const updateProfile = async (req, res) => {
  try {
    const { name, avatar, designation } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update name if provided
    if (name !== undefined) {
      if (!name || name.trim().length < 2 || name.trim().length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Name must be between 2 and 50 characters',
        });
      }
      user.name = name.trim();
    }

    // Update avatar if provided
    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    // Update designation if provided
    if (designation !== undefined) {
      if (designation.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Designation cannot exceed 100 characters',
        });
      }
      user.designation = designation.trim();
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: formatUser(user),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
    });
  }
};

// @route   POST /api/users/change-password
// @access  All authenticated users (admin, manager, employee)
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId; // From JWT middleware

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    // Get user with password field
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // If user has no password (Google-only), allow setting one without current password check
    if (!user.password) {
      user.password = newPassword;
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Password set successfully',
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
    });
  }
};
