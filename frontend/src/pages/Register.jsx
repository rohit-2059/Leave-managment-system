import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faEnvelope, faLock, faUser, faLeaf } from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { toast } from 'sonner';

// Only employees can self-register
// Managers are created by admin

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee', // Fixed role - only employees can self-register
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, googleSignIn, isAuthenticated, getDashboardPath, clearError } =
    useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate(getDashboardPath(), { replace: true });
    }
  }, [isAuthenticated]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    clearError();

    const { name, email, password, confirmPassword, role } = formData;

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await register(name.trim(), email.trim(), password, role);
      toast.success(`Welcome, ${data.user.name}! Account created successfully.`);
      navigate(getDashboardPath(data.user.role), { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    clearError();

    setIsSubmitting(true);
    try {
      const data = await googleSignIn('employee'); // Always register as employee
      toast.success(`Welcome, ${data.user.name}! Account created successfully.`);
      navigate(getDashboardPath(data.user.role), { replace: true });
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] border-2 border-gray-900 rounded-xl p-6 sm:p-8">
        {/* Header Section */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <FontAwesomeIcon icon={faLeaf} className="text-3xl text-gray-700" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 font-serif tracking-tight">
            Create Employee Account
          </h1>
          <p className="text-gray-600 text-sm">
            Join the Employee Leave Management System
          </p>
        </div>

        {/* Employee Role Badge */}
        <div className="mb-5">
          <div className="flex items-center justify-center gap-2 p-4 rounded-lg border border-gray-300 bg-gray-50">
            <FontAwesomeIcon icon={faUser} className="text-xl text-gray-700" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Employee Registration</p>
              <p className="text-xs text-gray-600">Apply for leave & track your requests</p>
            </div>
          </div>
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Name Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faUser} className="text-gray-500" />
              </div>
              <input
                type="text"
                name="name"
                placeholder="Full name"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white
                           text-gray-900 placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent
                           transition-all text-sm"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Email Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faEnvelope} className="text-gray-500" />
              </div>
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white
                           text-gray-900 placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent
                           transition-all text-sm"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faLock} className="text-gray-500" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password (min 6 characters)"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-11 pr-12 py-2.5 rounded-lg border border-gray-300 bg-white
                           text-gray-900 placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent
                           transition-all text-sm"
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-900 transition-colors"
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>

            {/* Confirm Password Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faLock} className="text-gray-500" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-11 pr-12 py-2.5 rounded-lg border border-gray-300 bg-white
                           text-gray-900 placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent
                           transition-all text-sm"
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-900 transition-colors"
              >
                <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
              </button>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg bg-gray-900 text-white font-medium text-sm
                         hover:bg-gray-800 active:bg-gray-700
                         disabled:opacity-60 disabled:cursor-not-allowed
                         transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                'Create Employee Account'
              )}
            </button>

            {/* Already have account */}
            <Link
              to="/login"
              className="block w-full py-2.5 rounded-lg bg-white border border-gray-300 text-gray-900 font-medium text-sm
                         text-center hover:bg-gray-50 active:bg-gray-100
                         transition-all"
            >
              Sign In to Existing Account
            </Link>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-600">Or continue with</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google Sign Up */}
          <div className="flex items-center justify-center">
            <button
              onClick={handleGoogleSignUp}
              disabled={isSubmitting}
              className="flex items-center gap-3 px-8 py-2.5 rounded-lg border border-gray-300
                         bg-white hover:bg-gray-50 active:bg-gray-100
                         disabled:opacity-60 disabled:cursor-not-allowed
                         transition-all text-sm font-medium text-gray-900 cursor-pointer"
            >
              <FontAwesomeIcon icon={faGoogle} className="text-lg" style={{ color: '#4285F4' }} />
              Sign up with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
