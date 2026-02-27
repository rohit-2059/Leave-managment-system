import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClipboardList,
  faCheck,
  faXmark,
  faClock,
  faFilter,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { getManagerLeaveRequests, adminReviewLeave } from '../../services/leaveService';

const statusColors = {
  pending: 'bg-gray-50 text-gray-700 border-gray-300',
  approved: 'bg-gray-50 text-gray-700 border-gray-300',
  rejected: 'bg-gray-50 text-gray-700 border-gray-300',
};

const statusIcons = {
  pending: faClock,
  approved: faCheck,
  rejected: faXmark,
};

const leaveTypeLabels = {
  sick: 'Sick Leave',
  casual: 'Casual Leave',
  earned: 'Earned Leave',
  unpaid: 'Unpaid Leave',
  other: 'Other',
};

const AdminManagerLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [reviewingId, setReviewingId] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const response = await getManagerLeaveRequests(filter);
      setLeaves(response.leaves || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch manager leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [filter]);

  const handleReview = async (leaveId, status) => {
    setActionLoading(true);
    try {
      const response = await adminReviewLeave(leaveId, status, adminNote);
      toast.success(response.message || `Leave ${status}`);
      setReviewingId(null);
      setAdminNote('');
      fetchLeaves();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to review request');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const pendingCount = leaves.filter((l) => l.status === 'pending').length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <p className="text-sm text-gray-500">
          {leaves.length} total • {pendingCount} pending
        </p>

        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faFilter} className="text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : leaves.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <FontAwesomeIcon icon={faClipboardList} className="text-4xl text-gray-400 mb-3" />
          <p className="text-gray-600">No manager leave requests found</p>
          <p className="text-sm text-gray-500 mt-1">
            Leave requests from managers will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaves.map((leave) => (
            <div
              key={leave._id}
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  {leave.employeeId?.avatar ? (
                    <img
                      src={leave.employeeId.avatar}
                      alt={leave.employeeId.name}
                      className="w-10 h-10 rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                      <FontAwesomeIcon icon={faUser} className="text-gray-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{leave.employeeId?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{leave.employeeId?.email}</p>
                    {leave.employeeId?.designation && (
                      <p className="text-[10px] text-gray-400 mt-0.5">{leave.employeeId.designation}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded border border-gray-300 bg-gray-50 text-gray-600 uppercase">
                    Manager
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[leave.status]}`}
                  >
                    <FontAwesomeIcon icon={statusIcons[leave.status]} className="text-[10px]" />
                    {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="ml-13 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900">
                    {leaveTypeLabels[leave.leaveType] || leave.leaveType}
                  </span>
                  <span className="text-xs text-gray-500">
                    • {leave.numberOfDays} day{leave.numberOfDays !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-sm text-gray-700">
                  {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                </p>
                <p className="text-sm text-gray-600">{leave.reason}</p>
              </div>

              {leave.managerNote && (
                <div className="mt-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Your Note:</p>
                  <p className="text-sm text-gray-700">{leave.managerNote}</p>
                </div>
              )}

              {leave.status === 'pending' && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  {reviewingId === leave._id ? (
                    <div className="space-y-3">
                      <textarea
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        placeholder="Add a note (optional)"
                        rows={2}
                        maxLength={300}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReview(leave._id, 'approved')}
                          disabled={actionLoading}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <FontAwesomeIcon icon={faCheck} /> Approve
                        </button>
                        <button
                          onClick={() => handleReview(leave._id, 'rejected')}
                          disabled={actionLoading}
                          className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <FontAwesomeIcon icon={faXmark} /> Reject
                        </button>
                        <button
                          onClick={() => {
                            setReviewingId(null);
                            setAdminNote('');
                          }}
                          className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setReviewingId(leave._id)}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                      >
                        Review
                      </button>
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-gray-400 mt-2">
                Applied: {formatDate(leave.createdAt)}
                {leave.reviewedAt && ` • Reviewed: ${formatDate(leave.reviewedAt)}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminManagerLeaves;
