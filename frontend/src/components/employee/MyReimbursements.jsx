import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReceipt, faCheck, faXmark, faClock, faFilter, faRotateLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { getMyReimbursements, withdrawReimbursement } from '../../services/reimbursementService';

const statusColors = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-300',
  manager_approved: 'bg-blue-50 text-blue-700 border-blue-300',
  admin_approved: 'bg-green-50 text-green-700 border-green-300',
  rejected: 'bg-red-50 text-red-700 border-red-300',
  withdrawn: 'bg-gray-50 text-gray-500 border-gray-300',
};

const statusIcons = {
  pending: faClock,
  manager_approved: faArrowRight,
  admin_approved: faCheck,
  rejected: faXmark,
  withdrawn: faRotateLeft,
};

const statusLabels = {
  pending: 'Pending',
  manager_approved: 'Manager Approved',
  admin_approved: 'Approved',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

const categoryLabels = {
  travel: 'Travel',
  food: 'Food',
  medical: 'Medical',
  equipment: 'Equipment',
  training: 'Training',
  other: 'Other',
};

const MyReimbursements = ({ refreshTrigger }) => {
  const [reimbursements, setReimbursements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [withdrawingId, setWithdrawingId] = useState(null);

  const fetchReimbursements = async () => {
    setLoading(true);
    try {
      const response = await getMyReimbursements(filter);
      setReimbursements(response.reimbursements || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch reimbursements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReimbursements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, refreshTrigger]);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatAmount = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <p className="text-sm text-gray-500">
          {reimbursements.length} reimbursement{reimbursements.length !== 1 ? 's' : ''}
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
            <option value="manager_approved">Manager Approved</option>
            <option value="admin_approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : reimbursements.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <FontAwesomeIcon icon={faReceipt} className="text-4xl text-gray-400 mb-3" />
          <p className="text-gray-600">No reimbursements found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reimbursements.map((r) => (
            <div key={r._id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{r.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{categoryLabels[r.category] || r.category}</span>
                    <span className="text-xs text-gray-400">&middot;</span>
                    <span className="text-sm font-medium text-gray-900">{formatAmount(r.amount)}</span>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[r.status]}`}
                >
                  <FontAwesomeIcon icon={statusIcons[r.status]} className="text-[10px]" />
                  {statusLabels[r.status]}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-2">{r.description}</p>
              <p className="text-[11px] text-gray-400 mb-2">Submitted {formatDate(r.createdAt)}</p>

              {r.managerNote && (
                <div className="mt-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Manager Note:</p>
                  <p className="text-sm text-gray-700">{r.managerNote}</p>
                </div>
              )}

              {r.adminNote && (
                <div className="mt-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Admin Note:</p>
                  <p className="text-sm text-gray-700">{r.adminNote}</p>
                </div>
              )}

              {r.status === 'pending' && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                  <button
                    onClick={async () => {
                      setWithdrawingId(r._id);
                      try {
                        await withdrawReimbursement(r._id);
                        toast.success('Reimbursement withdrawn');
                        fetchReimbursements();
                      } catch (error) {
                        toast.error(error.response?.data?.message || 'Failed to withdraw');
                      } finally {
                        setWithdrawingId(null);
                      }
                    }}
                    disabled={withdrawingId === r._id}
                    className="text-xs text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={faRotateLeft} className="mr-1" />
                    {withdrawingId === r._id ? 'Withdrawing...' : 'Withdraw'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReimbursements;
