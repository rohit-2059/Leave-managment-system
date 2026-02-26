import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/useSocket';
import Sidebar from '../../components/Sidebar';
import MessagingPanel from '../../components/MessagingPanel';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faCalendarDays,
  faClockRotateLeft,
  faCalendarPlus,
  faExclamationTriangle,
  faCommentDots,
  faGear,
  faEnvelope,
  faReceipt,
  faFileInvoiceDollar,
} from '@fortawesome/free-solid-svg-icons';
import LeaveBalance from '../../components/employee/LeaveBalance';
import ApplyLeave from '../../components/employee/ApplyLeave';
import MyLeaves from '../../components/employee/MyLeaves';
import RaiseComplaint from '../../components/employee/RaiseComplaint';
import MyComplaints from '../../components/employee/MyComplaints';
import ApplyReimbursement from '../../components/employee/ApplyReimbursement';
import MyReimbursements from '../../components/employee/MyReimbursements';
import Settings from '../../components/Settings';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const { unreadCount } = useSocket();
  const [activeTab, setActiveTab] = useState('overview');
  const [collapsed, setCollapsed] = useState(true);
  const [leaveRefresh, setLeaveRefresh] = useState(0);
  const [complaintRefresh, setComplaintRefresh] = useState(0);
  const [reimbursementRefresh, setReimbursementRefresh] = useState(0);
  const [messagingOpen, setMessagingOpen] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: faCalendarDays },
    { id: 'apply-leave', label: 'Apply Leave', icon: faCalendarPlus },
    { id: 'my-leaves', label: 'My Leaves', icon: faClockRotateLeft },
    { id: 'raise-complaint', label: 'Raise Complaint', icon: faExclamationTriangle },
    { id: 'my-complaints', label: 'My Complaints', icon: faCommentDots },
    { id: 'apply-reimbursement', label: 'Apply Reimbursement', icon: faFileInvoiceDollar },
    { id: 'my-reimbursements', label: 'My Reimbursements', icon: faReceipt },
    { id: 'settings', label: 'Settings', icon: faGear },
  ];

  const handleLeaveApplied = () => {
    setLeaveRefresh((prev) => prev + 1);
    setActiveTab('my-leaves');
  };

  const handleComplaintRaised = () => {
    setComplaintRefresh((prev) => prev + 1);
    setActiveTab('my-complaints');
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
                  <FontAwesomeIcon icon={faUser} className="text-xl sm:text-2xl text-gray-700" />
                </div>
              )}
              <div>
                <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">
                  Welcome, {user?.name || 'Employee'}!
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
          <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 text-gray-900">
              <FontAwesomeIcon 
                icon={tabs.find(t => t.id === activeTab)?.icon || faUser} 
                className="text-lg"
              />
              <h2 className="text-lg font-semibold">
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && <LeaveBalance refreshTrigger={leaveRefresh} />}
          {activeTab === 'apply-leave' && <ApplyLeave onLeaveApplied={handleLeaveApplied} />}
          {activeTab === 'my-leaves' && <MyLeaves refreshTrigger={leaveRefresh} />}
          {activeTab === 'raise-complaint' && <RaiseComplaint onComplaintRaised={handleComplaintRaised} />}
          {activeTab === 'my-complaints' && <MyComplaints refreshTrigger={complaintRefresh} />}
          {activeTab === 'apply-reimbursement' && <ApplyReimbursement onApplied={handleReimbursementApplied} />}
          {activeTab === 'my-reimbursements' && <MyReimbursements refreshTrigger={reimbursementRefresh} />}
          {activeTab === 'settings' && <Settings />}
        </div>
      </div>

      <MessagingPanel isOpen={messagingOpen} onClose={() => setMessagingOpen(false)} />
    </div>
  );
};

export default EmployeeDashboard;
