import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faUserTie,
  faUser,
  faShieldHalved,
  faCalendarCheck,
  faArrowRight,
  faExclamationCircle,
} from '@fortawesome/free-solid-svg-icons';
import { getAdminOverview } from '../../services/userService';

const AdminOverview = ({ onNavigate, prefetchedData }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    admins: 0,
    managers: 0,
    employees: 0,
    allocated: 0,
    unallocated: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [unallocatedEmployees, setUnallocatedEmployees] = useState([]);
  const [loading, setLoading] = useState(!prefetchedData);

  useEffect(() => {
    // If data was prefetched by parent, use it immediately
    if (prefetchedData) {
      setStats(prefetchedData.stats);
      setRecentUsers(prefetchedData.recentUsers || []);
      setUnallocatedEmployees(prefetchedData.unallocatedEmployees || []);
      setLoading(false);
      return;
    }
    // Fallback: fetch if no prefetched data
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getAdminOverview();
        if (cancelled) return;
        setStats(res.stats);
        setRecentUsers(res.recentUsers || []);
        setUnallocatedEmployees(res.unallocatedEmployees || []);
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [prefetchedData]);

  const getRoleIcon = (role) => {
    if (role === 'admin') return faShieldHalved;
    if (role === 'manager') return faUserTie;
    return faUser;
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="w-9 h-9 rounded-lg bg-gray-200 mb-3"></div>
              <div className="h-7 bg-gray-200 rounded w-12 mb-1"></div>
              <div className="h-3 bg-gray-100 rounded w-24"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200">
              <div className="px-5 py-3.5 border-b border-gray-100">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
              {[0, 1, 2].map((j) => (
                <div key={j} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-200"></div>
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
          onClick={() => onNavigate('manage-users')}
          className="bg-white rounded-lg border border-gray-200 p-4 text-left hover:border-gray-400 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
              <FontAwesomeIcon icon={faUsers} className="text-sm text-white" />
            </div>
            <FontAwesomeIcon icon={faArrowRight} className="text-xs text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Users</p>
        </button>

        <button
          onClick={() => onNavigate('create-manager')}
          className="bg-white rounded-lg border border-gray-200 p-4 text-left hover:border-gray-400 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
              <FontAwesomeIcon icon={faUserTie} className="text-sm text-white" />
            </div>
            <FontAwesomeIcon icon={faArrowRight} className="text-xs text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.managers}</p>
          <p className="text-xs text-gray-500 mt-0.5">Managers</p>
        </button>

        <button
          onClick={() => onNavigate('create-employee')}
          className="bg-white rounded-lg border border-gray-200 p-4 text-left hover:border-gray-400 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
              <FontAwesomeIcon icon={faUser} className="text-sm text-white" />
            </div>
            <FontAwesomeIcon icon={faArrowRight} className="text-xs text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.employees}</p>
          <p className="text-xs text-gray-500 mt-0.5">Employees</p>
        </button>

        <button
          onClick={() => onNavigate('leave-allocations')}
          className="bg-white rounded-lg border border-gray-200 p-4 text-left hover:border-gray-400 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
              <FontAwesomeIcon icon={faCalendarCheck} className="text-sm text-white" />
            </div>
            {stats.unallocated > 0 && (
              <span className="text-xs font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full">
                {stats.unallocated} pending
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.allocated}</p>
          <p className="text-xs text-gray-500 mt-0.5">Leave allocations</p>
        </button>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Users */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Recent Users</p>
            <button
              onClick={() => onNavigate('manage-users')}
              className="text-xs text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            >
              View all →
            </button>
          </div>
          {recentUsers.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-500">No users yet</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentUsers.map((u) => (
                <div key={u._id} className="flex items-center gap-3 px-5 py-3">
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-lg border border-gray-200 object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                      <FontAwesomeIcon icon={getRoleIcon(u.role)} className="text-xs text-gray-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded border border-gray-300 bg-white text-gray-600 uppercase shrink-0">
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unallocated Employees */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Pending Allocations</p>
            {unallocatedEmployees.length > 0 && (
              <button
                onClick={() => onNavigate('leave-allocations')}
                className="text-xs text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
              >
                Manage →
              </button>
            )}
          </div>
          {unallocatedEmployees.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-500">
              All employees have leave allocations
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {unallocatedEmployees.map((emp) => (
                <div key={emp._id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                    <FontAwesomeIcon icon={faExclamationCircle} className="text-xs text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{emp.name}</p>
                    <p className="text-xs text-gray-500 truncate">{emp.email}</p>
                  </div>
                  <button
                    onClick={() => onNavigate('leave-allocations')}
                    className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50 transition-colors cursor-pointer shrink-0"
                  >
                    Allocate
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
