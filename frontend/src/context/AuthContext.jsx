import { createContext, useContext, useState, useEffect } from 'react';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import api from '../services/api';
import { toast } from 'sonner';

// Detect if we're in production
const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // On mount, check for existing token in localStorage and handle Google redirect
  useEffect(() => {
    const initAuth = async () => {
      // First, check for Google redirect result
      try {
        await handleGoogleRedirect();
      } catch (err) {
        console.error('Google redirect error:', err);
      }

      // Then check for existing token
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);

          // Verify token is still valid
          api
            .get('/auth/me')
            .then((res) => {
              if (res.data.success) {
                setUser(res.data.user);
                localStorage.setItem('user', JSON.stringify(res.data.user));
              }
            })
            .catch(() => {
              // Token invalid — clear everything
              logout();
            });
        } catch {
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Save to localStorage whenever user/token changes
  const saveAuth = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  // Register with email/password
  const register = async (name, email, password, role) => {
    setError(null);
    try {
      const res = await api.post('/auth/register', {
        name,
        email,
        password,
        role,
      });
      if (res.data.success) {
        saveAuth(res.data.token, res.data.user);
        return res.data;
      }
    } catch (err) {
      const message =
        err.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
      throw new Error(message);
    }
  };

  // Login with email/password
  const login = async (email, password) => {
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        saveAuth(res.data.token, res.data.user);
        return res.data;
      }
    } catch (err) {
      const message =
        err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
      throw new Error(message);
    }
  };

  // Google Sign-In (popup for localhost, redirect for production)
  const googleSignIn = async (role = null) => {
    setError(null);
    
    try {
      if (isProduction) {
        // Production: Use redirect to avoid COOP issues
        if (role) {
          sessionStorage.setItem('pendingGoogleRole', role);
        }
        sessionStorage.setItem('googleAuthRedirect', 'true');
        await signInWithRedirect(auth, googleProvider);
      } else {
        // Localhost: Use popup for better dev experience
        const result = await signInWithPopup(auth, googleProvider);
        const firebaseToken = await result.user.getIdToken();

        const res = await api.post('/auth/google', { firebaseToken, role });
        if (res.data.success) {
          saveAuth(res.data.token, res.data.user);
          return res.data;
        }
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Google Sign-In failed. Please try again.';
      setError(message);
      throw err;
    }
  };

  // Handle Google redirect result (production only)
  const handleGoogleRedirect = async () => {
    // Skip on localhost since we use popup there
    if (!isProduction) return;
    
    try {
      const result = await getRedirectResult(auth);
      if (result && result.user) {
        const firebaseToken = await result.user.getIdToken();
        const role = sessionStorage.getItem('pendingGoogleRole');
        
        sessionStorage.removeItem('pendingGoogleRole');
        sessionStorage.removeItem('googleAuthRedirect');

        const res = await api.post('/auth/google', { firebaseToken, role });
        if (res.data.success) {
          saveAuth(res.data.token, res.data.user);
          return res.data;
        }
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Google Sign-In failed. Please try again.';
      setError(message);
      
      // Handle new user case - redirect to register
      if (err.response?.data?.isNewUser || message === 'NEW_USER') {
        sessionStorage.removeItem('pendingGoogleRole');
        sessionStorage.removeItem('googleAuthRedirect');
        return;
      }
      
      throw err;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
    } catch {
      // Firebase signOut may fail if not signed in with Firebase
    }
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Clear error
  const clearError = () => setError(null);

  // Update user data (after profile edit)
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Get dashboard path based on role
  const getDashboardPath = (userRole) => {
    const role = userRole || user?.role;
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'manager':
        return '/manager/dashboard';
      case 'employee':
        return '/employee/dashboard';
      default:
        return '/login';
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    register,
    login,
    googleSignIn,
    handleGoogleRedirect,
    logout,
    clearError,
    updateUser,
    getDashboardPath,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
