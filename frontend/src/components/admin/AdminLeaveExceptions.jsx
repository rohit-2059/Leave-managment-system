import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faCheck,
  faXmark,
  faGavel,
  faFilter,
  faUser,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { getEscalatedLeaves, overrideLeaveRejection } from '../../services/leaveService';

const overrideLabels = {
  none: 'Pending Review',
  approved: 'Overridden — Approved',
  upheld: 'Rejection Upheld',
};

const overrideColors = {
  none: 'bg-amber-50 text-amber-700 border-amber-300',
  approved: 'bg-green-50 text-green-700 border-green-300',
  upheld: 'bg-gray-50 text-gray-700 border-gray-300',
};

const leaveTypeLabels = {
  sick: 'Sick Leave',
  casual: 'Casual Leave',
  earned: 'Earned Leave',
  unpaid: 'Unpaid Leave',
  other: 'Other',
};

const AdminLeaveExceptions = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [reviewingId, setReviewingId] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const response = await getEscalatedLeaves(filter);
      setLeaves(response.leaves || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch escalated leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [filter]);

  const handleOverride = async (leaveId, decision) => {
    setActionLoading(true);
    try {
      const response = await overrideLeaveRejection(leaveId, decision, adminNote);
      toast.success(response.message || `Leave ${decision}`);
      setReviewingId(null);
      setAdminNote('');
      fetchLeaves();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process override');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const pendingCount = leaves.filter((l) => l.adminOverride === 'none').length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <p className="text-sm text-gray-500">
            {leaves.length} escalated • {pendingCount} pending review
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Leaves rejected by managers are escalated here for your review
          </p>
        </div>

        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faFilter} className="text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">All</option>
            <option value="none">Pending Review</option>
            <option value="approved">Overridden</option>
            <option value="upheld">Upheld</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : leaves.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-4xl text-gray-400 mb-3" />
          <p className="text-gray-600">No escalated leave exceptions</p>
          <p className="text-sm text-gray-500 mt-1">
            When a manager rejects an employee's leave, it will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaves.map((leave) => (
            <div
              key={leave._id}
              className={`border rounded-lg p-4 transition-colors ${
                leave.adminOverride === 'none'
                  ? 'border-amber-200 bg-amber-50/30'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Employee info + status */}
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
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${overrideColors[leave.adminOverride]}`}
                >
                  <FontAwesomeIcon
                    icon={leave.adminOverride === 'none' ? faExclamationTriangle : leave.adminOverride === 'approved' ? faCheck : faXmark}
                    className="text-[10px]"
                  />
                  {overrideLabels[leave.adminOverride]}
                </span>
              </div>

              {/* Leave details */}
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

              {/* Manager rejection note */}
              <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-500 mb-1 flex items-center gap-1">
                  <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                  Rejected by {leave.reviewedBy?.name || 'Manager'}
                  {leave.reviewedAt && ` on ${formatDate(leave.reviewedAt)}`}
                </p>
                {leave.managerNote && (
                  <p className="text-sm text-gray-700">{leave.managerNote}</p>
                )}
              </div>

              {/* Admin note (if already reviewed) */}
              {leave.adminNote && leave.adminOverride !== 'none' && (
                <div className="mt-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <FontAwesomeIcon icon={faShieldHalved} className="text-[10px]" />
                    Admin Note
                  </p>
                  <p className="text-sm text-gray-700">{leave.adminNote}</p>
                </div>
              )}

              {/* Admin actions — only for pending */}
              {leave.adminOverride === 'none' && (
                <div className="mt-3 pt-3 border-t border-gray-200">
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
                          onClick={() => handleOverride(leave._id, 'approved')}
                          disabled={actionLoading}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <FontAwesomeIcon icon={faCheck} /> Override — Approve
                        </button>
                        <button
                          onClick={() => handleOverride(leave._id, 'upheld')}
                          disabled={actionLoading}
                          className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <FontAwesomeIcon icon={faGavel} /> Uphold Rejection
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
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faGavel} className="text-xs" />
                        Review Exception
                      </button>
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-gray-400 mt-2">
                Applied: {formatDate(leave.createdAt)}
                {leave.adminReviewedAt && ` • Admin reviewed: ${formatDate(leave.adminReviewedAt)}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminLeaveExceptions;
