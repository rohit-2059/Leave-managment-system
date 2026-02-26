import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faExclamationTriangle,
  faClock,
  faCheck,
  faUser,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { getManagerOverview } from '../../services/teamService';

const ManagerOverview = ({ onNavigate, prefetchedData }) => {
  const [stats, setStats] = useState({
    teams: 0,
    totalMembers: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    rejectedLeaves: 0,
    pendingComplaints: 0,
    acceptedComplaints: 0,
  });
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(!prefetchedData);

  useEffect(() => {
    if (prefetchedData) {
      setStats(prefetchedData.stats);
      setRecentLeaves(prefetchedData.recentLeaves || []);
      setRecentComplaints(prefetchedData.recentComplaints || []);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getManagerOverview();
        if (cancelled) return;
        setStats(res.stats);
        setRecentLeaves(res.recentLeaves || []);
        setRecentComplaints(res.recentComplaints || []);
      } catch {
        // silently fail — stats are not critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [prefetchedData]);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {/* Skeleton stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="w-9 h-9 rounded-lg bg-gray-200 mb-3"></div>
              <div className="h-7 bg-gray-200 rounded w-12 mb-1"></div>
              <div className="h-3 bg-gray-100 rounded w-24"></div>
            </div>
          ))}
        </div>
        {/* Skeleton lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200">
              <div className="px-5 py-3.5 border-b border-gray-100">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
              {[0, 1, 2].map((j) => (
                <div key={j} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                  <div className="flex-1">
                    <div className="h-3.5 bg-gray-200 rounded w-28 mb-1.5"></div>
                    <div className="h-3 bg-gray-100 rounded w-40"></div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigate('my-teams')}
          className="bg-white rounded-lg border border-gray-200 p-4 text-left hover:border-gray-400 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
              <FontAwesomeIcon icon={faUsers} className="text-sm text-white" />
            </div>
            <FontAwesomeIcon icon={faArrowRight} className="text-xs text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.teams}</p>
          <p className="text-xs text-gray-500 mt-0.5">Teams · {stats.totalMembers} members</p>
        </button>

        <button
          onClick={() => onNavigate('leave-requests')}
          className="bg-white rounded-lg border border-gray-200 p-4 text-left hover:border-gray-400 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
              <FontAwesomeIcon icon={faClock} className="text-sm text-white" />
            </div>
            {stats.pendingLeaves > 0 && (
              <span className="text-xs font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full">
                Action needed
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.pendingLeaves}</p>
          <p className="text-xs text-gray-500 mt-0.5">Pending leave requests</p>
        </button>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <FontAwesomeIcon icon={faCheck} className="text-sm text-gray-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.approvedLeaves}</p>
          <p className="text-xs text-gray-500 mt-0.5">Leaves approved</p>
        </div>

        <button
          onClick={() => onNavigate('complaints')}
          className="bg-white rounded-lg border border-gray-200 p-4 text-left hover:border-gray-400 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-sm text-white" />
            </div>
            {stats.pendingComplaints > 0 && (
              <span className="text-xs font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full">
                Action needed
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.pendingComplaints}</p>
          <p className="text-xs text-gray-500 mt-0.5">Pending complaints</p>
        </button>
      </div>

      {/* Pending Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending Leaves */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Pending Leaves</p>
            {recentLeaves.length > 0 && (
              <button
                onClick={() => onNavigate('leave-requests')}
                className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
              >
                View all
              </button>
            )}
          </div>
          {recentLeaves.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-gray-400">No pending requests</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentLeaves.map((leave) => (
                <div key={leave._id} className="px-5 py-3 flex items-center gap-3">
                  {leave.employeeId?.avatar ? (
                    <img src={leave.employeeId.avatar} alt="" className="w-8 h-8 rounded-full border border-gray-200" />
                  ) : (
                    <div className="w-8 h-8 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center">
                      <FontAwesomeIcon icon={faUser} className="text-xs text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {leave.employeeId?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(leave.startDate)} — {formatDate(leave.endDate)} · {leave.numberOfDays}d
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">{formatDate(leave.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Complaints */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Pending Complaints</p>
            {recentComplaints.length > 0 && (
              <button
                onClick={() => onNavigate('complaints')}
                className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
              >
                View all
              </button>
            )}
          </div>
          {recentComplaints.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-gray-400">No pending complaints</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentComplaints.map((c) => (
                <div key={c._id} className="px-5 py-3 flex items-center gap-3">
                  {c.employeeId?.avatar ? (
                    <img src={c.employeeId.avatar} alt="" className="w-8 h-8 rounded-full border border-gray-200" />
                  ) : (
                    <div className="w-8 h-8 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center">
                      <FontAwesomeIcon icon={faUser} className="text-xs text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.subject}</p>
                    <p className="text-xs text-gray-500">{c.employeeId?.name || 'Unknown'}</p>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">{formatDate(c.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerOverview;
