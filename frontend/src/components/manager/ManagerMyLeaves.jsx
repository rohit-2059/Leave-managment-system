import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClockRotateLeft, faCheck, faXmark, faClock, faFilter, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { getMyLeaves, withdrawLeave } from '../../services/leaveService';

const statusColors = {
  pending: 'bg-gray-50 text-gray-700 border-gray-300',
  approved: 'bg-gray-50 text-gray-700 border-gray-300',
  rejected: 'bg-gray-50 text-gray-700 border-gray-300',
  withdrawn: 'bg-gray-50 text-gray-700 border-gray-300',
};

const statusIcons = {
  pending: faClock,
  approved: faCheck,
  rejected: faXmark,
  withdrawn: faRotateLeft,
};

const leaveTypeLabels = {
  sick: 'Sick Leave',
  casual: 'Casual Leave',
  earned: 'Earned Leave',
  unpaid: 'Unpaid Leave',
  other: 'Other',
};

const ManagerMyLeaves = ({ refreshTrigger }) => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [withdrawingId, setWithdrawingId] = useState(null);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const response = await getMyLeaves(filter);
      setLeaves(response.leaves || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [filter, refreshTrigger]);

  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <p className="text-sm text-gray-500">{leaves.length} request{leaves.length !== 1 ? 's' : ''}</p>

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
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : leaves.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <FontAwesomeIcon icon={faClockRotateLeft} className="text-4xl text-gray-400 mb-3" />
          <p className="text-gray-600">No leave requests found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaves.map((leave) => (
            <div key={leave._id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {leaveTypeLabels[leave.leaveType] || leave.leaveType}
                  </span>
                  <span className="text-xs text-gray-500">• {leave.numberOfDays} day{leave.numberOfDays !== 1 ? 's' : ''}</span>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[leave.status]}`}>
                  <FontAwesomeIcon icon={statusIcons[leave.status]} className="text-[10px]" />
                  {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                </span>
              </div>

              <p className="text-sm text-gray-700 mb-2">
                {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
              </p>
              <p className="text-sm text-gray-600 mb-2">{leave.reason}</p>

              {leave.managerNote && (
                <div className="mt-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Admin Note:</p>
                  <p className="text-sm text-gray-700">{leave.managerNote}</p>
                </div>
              )}

              {leave.status === 'pending' && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                  <button
                    onClick={async () => {
                      setWithdrawingId(leave._id);
                      try {
                        await withdrawLeave(leave._id);
                        toast.success('Leave request withdrawn');
                        fetchLeaves();
                      } catch (error) {
                        toast.error(error.response?.data?.message || 'Failed to withdraw');
                      } finally {
                        setWithdrawingId(null);
                      }
                    }}
                    disabled={withdrawingId === leave._id}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={faRotateLeft} className="text-xs" />
                    {withdrawingId === leave._id ? 'Withdrawing...' : 'Withdraw'}
                  </button>
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

export default ManagerMyLeaves;
