import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faCheck,
  faXmark,
  faClock,
  faFilter,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { getTeamComplaints, reviewComplaint } from '../../services/complaintService';

const statusColors = {
  pending: 'bg-gray-50 text-gray-700 border-gray-300',
  accepted: 'bg-gray-50 text-gray-700 border-gray-300',
  rejected: 'bg-gray-50 text-gray-700 border-gray-300',
};

const statusIcons = {
  pending: faClock,
  accepted: faCheck,
  rejected: faXmark,
};

const categoryLabels = {
  workplace: 'Workplace Issue',
  harassment: 'Harassment',
  workload: 'Workload',
  salary: 'Salary & Compensation',
  leave: 'Leave Related',
  other: 'Other',
};

const TeamComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [reviewingId, setReviewingId] = useState(null);
  const [managerNote, setManagerNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await getTeamComplaints(filter);
      setComplaints(response.complaints || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [filter]);

  const handleReview = async (complaintId, status) => {
    setActionLoading(true);
    try {
      const response = await reviewComplaint(complaintId, status, managerNote);
      toast.success(response.message || `Complaint ${status}`);
      setReviewingId(null);
      setManagerNote('');
      fetchComplaints();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to review complaint');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const pendingCount = complaints.filter((c) => c.status === 'pending').length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <p className="text-sm text-gray-500">
          {complaints.length} total • {pendingCount} pending
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
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-4xl text-gray-400 mb-3" />
          <p className="text-gray-600">No complaints found</p>
          <p className="text-sm text-gray-500 mt-1">
            Complaints from your team members will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((complaint) => (
            <div
              key={complaint._id}
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  {complaint.employeeId?.avatar ? (
                    <img
                      src={complaint.employeeId.avatar}
                      alt={complaint.employeeId.name}
                      className="w-10 h-10 rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                      <FontAwesomeIcon icon={faUser} className="text-gray-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {complaint.employeeId?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500">{complaint.employeeId?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded border border-gray-300 bg-white text-gray-700">
                    {categoryLabels[complaint.category] || complaint.category}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[complaint.status]}`}
                  >
                    <FontAwesomeIcon icon={statusIcons[complaint.status]} className="text-[10px]" />
                    {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-gray-900">{complaint.subject}</h3>
                <p className="text-sm text-gray-600">{complaint.description}</p>
              </div>

              {complaint.managerNote && (
                <div className="mt-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Your Note:</p>
                  <p className="text-sm text-gray-700">{complaint.managerNote}</p>
                </div>
              )}

              {complaint.status === 'pending' && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  {reviewingId === complaint._id ? (
                    <div className="space-y-3">
                      <textarea
                        value={managerNote}
                        onChange={(e) => setManagerNote(e.target.value)}
                        placeholder="Add a note (optional)"
                        rows={2}
                        maxLength={500}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReview(complaint._id, 'accepted')}
                          disabled={actionLoading}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <FontAwesomeIcon icon={faCheck} /> Accept
                        </button>
                        <button
                          onClick={() => handleReview(complaint._id, 'rejected')}
                          disabled={actionLoading}
                          className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <FontAwesomeIcon icon={faXmark} /> Reject
                        </button>
                        <button
                          onClick={() => {
                            setReviewingId(null);
                            setManagerNote('');
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
                        onClick={() => setReviewingId(complaint._id)}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                      >
                        Review
                      </button>
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-gray-400 mt-2">
                Submitted: {formatDate(complaint.createdAt)}
                {complaint.reviewedAt && ` • Reviewed: ${formatDate(complaint.reviewedAt)}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamComplaints;
