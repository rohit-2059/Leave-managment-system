import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReceipt, faCheck, faXmark, faClock, faFilter } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { getTeamReimbursements, managerReviewReimbursement } from '../../services/reimbursementService';

const categoryLabels = {
  travel: 'Travel',
  food: 'Food',
  medical: 'Medical',
  equipment: 'Equipment',
  training: 'Training',
  other: 'Other',
};

const statusLabels = {
  pending: 'Pending',
  manager_approved: 'Manager Approved',
  admin_approved: 'Approved',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

const TeamReimbursements = () => {
  const [reimbursements, setReimbursements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [reviewingId, setReviewingId] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [activeNoteId, setActiveNoteId] = useState(null);

  const fetchReimbursements = async () => {
    setLoading(true);
    try {
      const response = await getTeamReimbursements(filter);
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
      const response = await managerReviewReimbursement(id, status, noteText);
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
            <option value="">Pending</option>
            <option value="manager_approved">Manager Approved</option>
            <option value="admin_approved">Approved</option>
            <option value="rejected">Rejected</option>
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
          {reimbursements.map((r) => (
            <div key={r._id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{r.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">
                      {r.applicantId?.name || 'Unknown'} · {categoryLabels[r.category] || r.category}
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-sm font-medium text-gray-900">{formatAmount(r.amount)}</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border bg-yellow-50 text-yellow-700 border-yellow-300">
                  <FontAwesomeIcon icon={faClock} className="text-[10px]" />
                  {statusLabels[r.status]}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-2">{r.description}</p>
              <p className="text-[11px] text-gray-400 mb-3">Submitted {formatDate(r.createdAt)}</p>

              {r.status === 'pending' && (
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
                          onClick={() => handleReview(r._id, 'manager_approved')}
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
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamReimbursements;
