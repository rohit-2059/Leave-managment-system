import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket, faUser, faLeaf } from '@fortawesome/free-solid-svg-icons';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2 sm:gap-3">
        <FontAwesomeIcon icon={faLeaf} className="text-lg sm:text-xl text-gray-700" />
        <h1 className="text-sm sm:text-lg font-semibold text-gray-900">
          Leave Management
        </h1>
      </div>

      {user && (
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-[10px] sm:text-xs font-medium px-2 sm:px-3 py-1 rounded border border-gray-300 bg-white text-gray-700 capitalize">
            {user.role}
          </span>

          <div className="hidden sm:flex items-center gap-2">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded border border-gray-200"
              />
            ) : (
              <div className="w-8 h-8 rounded border border-gray-200 bg-gray-50 flex items-center justify-center">
                <FontAwesomeIcon icon={faUser} size="sm" className="text-gray-600" />
              </div>
            )}
            <span className="text-sm font-medium text-gray-700">
              {user.name}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-xs sm:text-sm border border-gray-300 hover:bg-gray-50 px-2 sm:px-3 py-1.5 rounded transition-colors cursor-pointer text-gray-700"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="text-xs sm:text-sm" />
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
