import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRightFromBracket,
  faShieldHalved,
  faUserTie,
  faUser,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';

const Sidebar = ({ activeTab, setActiveTab, tabs = [], collapsed, setCollapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleIcon = () => {
    if (user?.role === 'admin') return faShieldHalved;
    if (user?.role === 'manager') return faUserTie;
    return faUser;
  };

  // Map tabs directly to navigation buttons
  const navItems = tabs.length > 0 ? tabs : [];

  return (
    <div className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-40 ${collapsed ? 'w-18' : 'w-60'}`}>
      {/* Project Logo */}
      <div className={`flex items-center py-3 border-b border-gray-200 ${collapsed ? 'justify-center px-3' : 'px-4 gap-3'}`}>
        {/* Replace '/logo.png' with your logo path (place image in public/ folder) */}
        <img
          src="/logo.png"
          alt="Logo"
          className={`rounded-lg object-contain shrink-0 ${collapsed ? 'w-12 h-12' : 'w-14 h-14'}`}
        />
        {!collapsed && (
          <span className="text-xl font-black tracking-widest text-gray-900 italic">
            LMS
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
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <FontAwesomeIcon icon={item.icon} className="text-base shrink-0" />
              
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="py-3 border-t border-gray-200 flex flex-col gap-1 px-3">
        {/* Logout */}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : ''}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
            collapsed ? 'justify-center' : ''
          } text-gray-600 hover:bg-red-50 hover:text-red-600`}
        >
          <FontAwesomeIcon icon={faRightFromBracket} className="text-base shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-gray-600 hover:bg-gray-100 hover:text-gray-900 ${
            collapsed ? 'justify-center' : ''
          }`}
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
