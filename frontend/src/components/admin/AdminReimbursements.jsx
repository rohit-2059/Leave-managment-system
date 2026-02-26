import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faReceipt,
  faCheck,
  faXmark,
  faClock,
  faFilter,
  faArrowRight,
  faUserTie,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { getAdminReimbursements, adminReviewReimbursement } from '../../services/reimbursementService';

const statusColors = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-300',
  manager_approved: 'bg-blue-50 text-blue-700 border-blue-300',
  admin_approved: 'bg-green-50 text-green-700 border-green-300',
  rejected: 'bg-red-50 text-red-700 border-red-300',
};

const statusLabels = {
  pending: 'Pending',
  manager_approved: 'Mgr Approved',
  admin_approved: 'Approved',
  rejected: 'Rejected',
};

const categoryLabels = {
  travel: 'Travel',
  food: 'Food',
  medical: 'Medical',
  equipment: 'Equipment',
  training: 'Training',
  other: 'Other',
};

const AdminReimbursements = () => {
  const [reimbursements, setReimbursements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [reviewingId, setReviewingId] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [activeNoteId, setActiveNoteId] = useState(null);

  const fetchReimbursements = async () => {
    setLoading(true);
    try {
      const response = await getAdminReimbursements(filter);
      setReimbursements(response.reimbursements || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch reimbursements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReimbursements();
  }, [filter]);

  const handleReview = async (id, status) => {
    setReviewingId(id);
    try {
      const response = await adminReviewReimbursement(id, status, noteText);
      toast.success(response.message);
      setNoteText('');
      setActiveNoteId(null);
      fetchReimbursements();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to review reimbursement');
    } finally {
      setReviewingId(null);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatAmount = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

  // Check if a reimbursement can be reviewed by admin
  const canReview = (r) => {
    if (r.applicantRole === 'employee' && r.status === 'manager_approved') return true;
    if (r.applicantRole === 'manager' && r.status === 'pending') return true;
    return false;
  };

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
            <option value="">Pending Review</option>
            <option value="admin_approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="pending">Employee Pending (Mgr)</option>
            <option value="manager_approved">Manager Approved</option>
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
          <p className="text-gray-600">No reimbursements to review</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reimbursements.map((r) => {
            const stColor = statusColors[r.status] || 'bg-gray-50 text-gray-700 border-gray-300';
            const stLabel = statusLabels[r.status] || r.status;
            const roleIcon = r.applicantRole === 'manager' ? faUserTie : faUser;
            const roleLabel = r.applicantRole === 'manager' ? 'Manager' : 'Employee';

            return (
              <div key={r._id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{r.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <FontAwesomeIcon icon={roleIcon} className="text-[10px]" />
                        {r.applicantId?.name || 'Unknown'} ({roleLabel})
                      </span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">{categoryLabels[r.category] || r.category}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-sm font-medium text-gray-900">{formatAmount(r.amount)}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${stColor}`}>
                    {stLabel}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-2">{r.description}</p>
                <p className="text-[11px] text-gray-400 mb-2">Submitted {formatDate(r.createdAt)}</p>

                {/* Manager approval info (for employee reimbursements) */}
                {r.managerReviewedBy && (
                  <div className="mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-600">
                      <FontAwesomeIcon icon={faCheck} className="mr-1" />
                      Approved by {r.managerReviewedBy?.name || 'Manager'}
                      {r.managerNote && ` — "${r.managerNote}"`}
                    </p>
                  </div>
                )}

                {canReview(r) && (
                  <div className="pt-3 border-t border-gray-100">
                    {activeNoteId === r._id ? (
                      <div className="space-y-2">
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Add a note (optional)..."
                          maxLength={300}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleReview(r._id, 'admin_approved')}
                            disabled={reviewingId === r._id}
                            className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center gap-1"
                          >
                            <FontAwesomeIcon icon={faCheck} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReview(r._id, 'rejected')}
                            disabled={reviewingId === r._id}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1"
                          >
                            <FontAwesomeIcon icon={faXmark} />
                            Reject
                          </button>
                          <button
                            onClick={() => { setActiveNoteId(null); setNoteText(''); }}
                            className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveNoteId(r._id)}
                          className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 flex items-center gap-1"
                        >
                          <FontAwesomeIcon icon={faCheck} />
                          Review
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminReimbursements;
