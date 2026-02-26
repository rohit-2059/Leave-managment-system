import { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import { getAdminOverview } from '../../services/userService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faGrip, faUserTie, faUser, faUsers, faCalendarCheck, faGear, faReceipt } from '@fortawesome/free-solid-svg-icons';

const AdminOverview = lazy(() => import('../../components/admin/AdminOverview'));
const CreateManager = lazy(() => import('../../components/admin/CreateManager'));
const CreateEmployee = lazy(() => import('../../components/admin/CreateEmployee'));
const ManageUsers = lazy(() => import('../../components/admin/ManageUsers'));
const LeaveAllocations = lazy(() => import('../../components/admin/LeaveAllocations'));
const AdminReimbursements = lazy(() => import('../../components/admin/AdminReimbursements'));
const Settings = lazy(() => import('../../components/Settings'));

const TabFallback = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [collapsed, setCollapsed] = useState(true);
  // Prefetch overview data immediately — starts in parallel with lazy chunk load
  const [prefetchedData, setPrefetchedData] = useState(null);

  useEffect(() => {
    getAdminOverview()
      .then((data) => setPrefetchedData(data))
      .catch(() => {});
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: faGrip },
    { id: 'create-manager', label: 'Create Manager', icon: faUserTie },
    { id: 'create-employee', label: 'Create Employee', icon: faUser },
    { id: 'manage-users', label: 'Manage Users', icon: faUsers },
    { id: 'leave-allocations', label: 'Leave Allocations', icon: faCalendarCheck },
    { id: 'reimbursements', label: 'Reimbursements', icon: faReceipt },
    { id: 'settings', label: 'Settings', icon: faGear },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`${collapsed ? 'ml-18' : 'ml-60'} transition-all duration-300 px-4 sm:px-6 py-4 sm:py-6`}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg border border-gray-200"
                />
              ) : (
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                  <FontAwesomeIcon icon={faShieldHalved} className="text-xl sm:text-2xl text-gray-700" />
                </div>
              )}
              <div>
                <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">
                  Welcome, {user?.name || 'Admin'}!
                </h1>
                <span className="inline-block mt-1 text-xs font-medium px-3 py-1 rounded border border-gray-300 bg-white text-gray-700 uppercase">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          {/* Current Tab Indicator */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 text-gray-900">
              <FontAwesomeIcon 
                icon={tabs.find(t => t.id === activeTab)?.icon || faShieldHalved} 
                className="text-lg"
              />
              <h2 className="text-lg font-semibold">
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
            </div>
          </div>

          {/* Tab Content */}
          <Suspense fallback={<TabFallback />}>
            {activeTab === 'overview' && <AdminOverview onNavigate={(tab) => setActiveTab(tab)} prefetchedData={prefetchedData} />}
            {activeTab === 'create-manager' && <CreateManager />}
            {activeTab === 'create-employee' && <CreateEmployee />}
            {activeTab === 'manage-users' && <ManageUsers />}
            {activeTab === 'leave-allocations' && <LeaveAllocations />}
            {activeTab === 'reimbursements' && <AdminReimbursements />}
            {activeTab === 'settings' && <Settings />}
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
