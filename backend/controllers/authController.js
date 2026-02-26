import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { admin } from '../config/firebase.js';

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Format user response (no password)
const formatUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  authProvider: user.authProvider,
  createdAt: user.createdAt,
});

// ============================================
// POST /api/auth/register  (Email/Password)
// ============================================
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and role',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Check valid role
    if (!['admin', 'manager', 'employee'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be admin, manager, or employee',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      authProvider: 'local',
    });

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error('Register error:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
    });
  }
};

// ============================================
// POST /api/auth/login  (Email/Password)
// ============================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if user registered with Google
    if (user.authProvider === 'google' && !user.password) {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google Sign-In. Please sign in with Google.',
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

// ============================================
// POST /api/auth/google  (Google Sign-In)
// ============================================
export const googleLogin = async (req, res) => {
  try {
    const { firebaseToken, role } = req.body;

    if (!firebaseToken) {
      return res.status(400).json({
        success: false,
        message: 'Firebase token is required',
      });
    }

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    } catch (firebaseError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired Google token',
      });
    }

    const { uid, email, name, picture } = decodedToken;

    // Check if user already exists
    let user = await User.findOne({
      $or: [{ firebaseUid: uid }, { email }],
    });

    if (user) {
      // Existing user — update Firebase UID and avatar if needed
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
        user.authProvider = 'google';
      }
      // Always update avatar from Google profile
      if (picture && picture !== user.avatar) {
        user.avatar = picture;
      }
      await user.save();
    } else {
      // New user — check if role provided
      if (!role) {
        // First-time user without role selection (coming from login page)
        return res.status(400).json({
          success: false,
          message: 'NEW_USER',
          isNewUser: true,
        });
      }

      // Validate role
      if (!['admin', 'manager', 'employee'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Please select a valid role (admin, manager, or employee)',
        });
      }

      user = await User.create({
        name: name || email.split('@')[0],
        email,
        firebaseUid: uid,
        avatar: picture || '',
        role,
        authProvider: 'google',
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: user ? 'Login successful' : 'Account created successfully',
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during Google authentication',
    });
  }
};

// ============================================
// GET /api/auth/me  (Get current user)
// ============================================
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      user: formatUser(user),
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
