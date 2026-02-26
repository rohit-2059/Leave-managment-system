import { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/useSocket';
import Sidebar from '../../components/Sidebar';
import MessagingPanel from '../../components/MessagingPanel';
import { getManagerOverview } from '../../services/teamService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserTie,
  faUsers,
  faPlus,
  faClipboardList,
  faExclamationTriangle,
  faGrip,
  faGear,
  faEnvelope,
  faReceipt,
  faFileInvoiceDollar,
  faMoneyCheckDollar,
} from '@fortawesome/free-solid-svg-icons';

// Lazy load tab components — only loaded when their tab is active
const ManagerOverview = lazy(() => import('../../components/manager/ManagerOverview'));
const CreateTeam = lazy(() => import('../../components/manager/CreateTeam'));
const MyTeams = lazy(() => import('../../components/manager/MyTeams'));
const ManageTeam = lazy(() => import('../../components/manager/ManageTeam'));
const TeamLeaveRequests = lazy(() => import('../../components/manager/TeamLeaveRequests'));
const TeamComplaints = lazy(() => import('../../components/manager/TeamComplaints'));
const TeamReimbursements = lazy(() => import('../../components/manager/TeamReimbursements'));
const ManagerApplyReimbursement = lazy(() => import('../../components/manager/ManagerApplyReimbursement'));
const ManagerMyReimbursements = lazy(() => import('../../components/manager/ManagerMyReimbursements'));
const Settings = lazy(() => import('../../components/Settings'));

const TabFallback = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const ManagerDashboard = () => {
  const { user } = useAuth();
  const { unreadCount } = useSocket();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [collapsed, setCollapsed] = useState(true);
  const [messagingOpen, setMessagingOpen] = useState(false);
  const [reimbursementRefresh, setReimbursementRefresh] = useState(0);
  // Prefetch overview data immediately
  const [prefetchedData, setPrefetchedData] = useState(null);

  useEffect(() => {
    getManagerOverview()
      .then((data) => setPrefetchedData(data))
      .catch(() => {});
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: faGrip },
    { id: 'my-teams', label: 'My Teams', icon: faUsers },
    { id: 'create-team', label: 'Create Team', icon: faPlus },
    { id: 'leave-requests', label: 'Leave Requests', icon: faClipboardList },
    { id: 'complaints', label: 'Complaints', icon: faExclamationTriangle },
    { id: 'team-reimbursements', label: 'Team Reimbursements', icon: faMoneyCheckDollar },
    { id: 'apply-reimbursement', label: 'Apply Reimbursement', icon: faFileInvoiceDollar },
    { id: 'my-reimbursements', label: 'My Reimbursements', icon: faReceipt },
    { id: 'settings', label: 'Settings', icon: faGear },
  ];

  const handleTeamCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
    setActiveTab('my-teams');
  };

  const handleSelectTeam = (teamId) => {
    setSelectedTeamId(teamId);
    setActiveTab('manage-team');
  };

  const handleBackToTeams = () => {
    setSelectedTeamId(null);
    setActiveTab('my-teams');
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleReimbursementApplied = () => {
    setReimbursementRefresh((prev) => prev + 1);
    setActiveTab('my-reimbursements');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`${collapsed ? 'ml-18' : 'ml-60'} transition-all duration-300 px-4 sm:px-6 py-4 sm:py-6`}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg border border-gray-200"
                />
              ) : (
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                  <FontAwesomeIcon icon={faUserTie} className="text-xl sm:text-2xl text-gray-700" />
                </div>
              )}
              <div>
                <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">
                  Welcome, {user?.name || 'Manager'}!
                </h1>
                <span className="inline-block mt-1 text-xs font-medium px-3 py-1 rounded border border-gray-300 bg-white text-gray-700 uppercase">
                  {user?.role}
                </span>
              </div>
            </div>
            <button
              onClick={() => setMessagingOpen(true)}
              className="relative bg-gray-900 text-white p-2.5 rounded-lg hover:bg-gray-800 transition-colors"
              title="Messages"
            >
              <FontAwesomeIcon icon={faEnvelope} className="text-base" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            </div>
          </div>

          {/* Current Tab Indicator */}
          {activeTab !== 'manage-team' && (
            <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 text-gray-900">
                <FontAwesomeIcon 
                  icon={tabs.find(t => t.id === activeTab)?.icon || faUserTie} 
                  className="text-lg"
                />
                <h2 className="text-lg font-semibold">
                  {tabs.find(t => t.id === activeTab)?.label}
                </h2>
              </div>
            </div>
          )}

          {/* Tab Content */}
          <Suspense fallback={<TabFallback />}>
          <div>
            {activeTab === 'overview' && (
              <ManagerOverview onNavigate={(tab) => setActiveTab(tab)} prefetchedData={prefetchedData} />
            )}
            {activeTab === 'my-teams' && (
              <MyTeams onSelectTeam={handleSelectTeam} refreshTrigger={refreshTrigger} />
            )}
            {activeTab === 'create-team' && (
              <CreateTeam onTeamCreated={handleTeamCreated} />
            )}
            {activeTab === 'manage-team' && selectedTeamId && (
              <ManageTeam teamId={selectedTeamId} onBack={handleBackToTeams} />
            )}
            {activeTab === 'leave-requests' && <TeamLeaveRequests />}
            {activeTab === 'complaints' && <TeamComplaints />}
            {activeTab === 'team-reimbursements' && <TeamReimbursements />}
            {activeTab === 'apply-reimbursement' && <ManagerApplyReimbursement onApplied={handleReimbursementApplied} />}
            {activeTab === 'my-reimbursements' && <ManagerMyReimbursements refreshTrigger={reimbursementRefresh} />}
            {activeTab === 'settings' && <Settings />}
          </div>
          </Suspense>
        </div>
      </div>

      <MessagingPanel isOpen={messagingOpen} onClose={() => setMessagingOpen(false)} />
    </div>
  );
};

export default ManagerDashboard;
