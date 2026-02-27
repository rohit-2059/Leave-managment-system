import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faEnvelope, faLock, faUser, faUserTie, faShieldHalved, faLeaf } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, googleSignIn, isAuthenticated, getDashboardPath, clearError } =
    useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate(getDashboardPath(), { replace: true });
    }
  }, [isAuthenticated]);

  // Load remembered email
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRemember(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    clearError();

    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await login(email, password);

      // Handle remember me
      if (remember) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      toast.success(`Welcome back, ${data.user.name}!`);
      navigate(getDashboardPath(data.user.role), { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    setIsSubmitting(true);
    try {
      // For login, role is not needed (existing users already have a role)
      const data = await googleSignIn();
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate(getDashboardPath(data.user.role), { replace: true });
    } catch (err) {
      // Check if it's a new user without an account
      const errorMessage = err.response?.data?.message || err.message;
      const isNewUser = err.response?.data?.isNewUser;
      
      if (errorMessage === 'NEW_USER' || isNewUser) {
        toast.error('Account not found. Please sign up first!', {
          duration: 4000,
        });
        setTimeout(() => {
          navigate('/register');
        }, 2000);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-[520px] flame-border">
      <div className="flame-border-inner p-6 sm:p-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <FontAwesomeIcon icon={faLeaf} className="text-3xl text-gray-700" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-2 font-serif tracking-tight">
            Absentra
          </h1>
          <p className="text-gray-600 text-base">
              Welcome back
          </p>
        </div>

        {/* Role Info Cards */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2.5 border border-gray-200">
            <div className="w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
              <FontAwesomeIcon icon={faUser} className="text-gray-700 text-sm" />
            </div>
            <span className="text-xs font-medium text-gray-900">Employee</span>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2.5 border border-gray-200">
            <div className="w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
              <FontAwesomeIcon icon={faUserTie} className="text-gray-700 text-sm" />
            </div>
            <span className="text-xs font-medium text-gray-900">Manager</span>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2.5 border border-gray-200">
            <div className="w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
              <FontAwesomeIcon icon={faShieldHalved} className="text-gray-700 text-sm" />
            </div>
            <span className="text-xs font-medium text-gray-900">Admin</span>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-600">sign in to your account</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faEnvelope} className="text-gray-500" />
              </div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400 accent-gray-900"
                />
                <span className="text-sm text-gray-700">
                  Remember for 30 days
                </span>
              </label>
              <button
                type="button"
                className="text-sm text-gray-700 hover:text-gray-900 font-medium underline underline-offset-2 transition-colors"
              >
                Forgot password
              </button>
            </div>

            {/* Sign In Button */}
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
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Create New Account Button */}
            <Link
              to="/register"
              className="block w-full py-2.5 rounded-lg bg-white border border-gray-300 text-gray-900 font-medium text-sm
                         text-center hover:bg-gray-50 active:bg-gray-100
                         transition-all"
            >
              Create New Account
            </Link>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-600">Or continue with</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Social Login Buttons */}
          <div className="flex items-center justify-center">
            <button
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="flex items-center gap-3 px-8 py-2.5 rounded-lg border border-gray-300
                         bg-white hover:bg-gray-50 active:bg-gray-100
                         disabled:opacity-60 disabled:cursor-not-allowed
                         transition-all text-sm font-medium text-gray-900 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Login;
