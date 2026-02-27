import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRightFromBracket,
  faChevronLeft,
  faChevronRight,
  faSun,
  faMoon,
} from '@fortawesome/free-solid-svg-icons';

const Sidebar = ({ activeTab, setActiveTab, tabs = [], collapsed, setCollapsed }) => {
  const { logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Map tabs directly to navigation buttons
  const navItems = tabs.length > 0 ? tabs : [];

  return (
    <div className={`fixed left-0 top-0 h-screen flex flex-col transition-all duration-300 z-40 ${collapsed ? 'w-18' : 'w-60'} ${darkMode ? 'bg-gray-900 border-r border-gray-700' : 'bg-white border-r border-gray-200'}`}>
      {/* Project Logo */}
      <div className={`flex items-center py-3 ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'} ${collapsed ? 'justify-center px-3' : 'px-4 gap-3'}`}>
        <img
          src="/logo.png"
          alt="Logo"
          className={`rounded-lg object-contain shrink-0 ${collapsed ? 'w-7 h-7' : 'w-8 h-8'} ${darkMode ? 'invert' : ''}`}
        />
        {!collapsed && (
          <span className={`text-xl font-bold tracking-wide ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Absentra
          </span>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-3 flex flex-col gap-1 px-3">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => {
                if (setActiveTab) {
                  setActiveTab(item.id);
                }
              }}
              title={collapsed ? item.label : ''}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? (darkMode ? 'bg-white text-gray-900' : 'bg-gray-900 text-white')
                  : (darkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
              }`}
            >
              <FontAwesomeIcon icon={item.icon} className="text-base shrink-0" />
              
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className={`py-3 flex flex-col gap-1 px-3 ${darkMode ? 'border-t border-gray-700' : 'border-t border-gray-200'}`}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={collapsed ? (darkMode ? 'Light Mode' : 'Dark Mode') : ''}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
            collapsed ? 'justify-center' : ''
          } ${darkMode ? 'text-yellow-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
        >
          <FontAwesomeIcon icon={darkMode ? faSun : faMoon} className="text-base shrink-0" />
          {!collapsed && <span className="text-sm font-medium">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : ''}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
            collapsed ? 'justify-center' : ''
          } ${darkMode ? 'text-gray-400 hover:bg-red-900/50 hover:text-red-400' : 'text-gray-600 hover:bg-red-50 hover:text-red-600'}`}
        >
          <FontAwesomeIcon icon={faRightFromBracket} className="text-base shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
            collapsed ? 'justify-center' : ''
          } ${darkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
        >
          {collapsed ? (
            <FontAwesomeIcon icon={faChevronRight} className="text-base shrink-0" />
          ) : (
            <>
              <FontAwesomeIcon icon={faChevronLeft} className="text-base shrink-0" />
              <span className="text-sm font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
