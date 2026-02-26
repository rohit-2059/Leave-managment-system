import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faUserTie, faShieldHalved, faTrash, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { getAllUsers, deleteUser } from '../../services/userService';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getAllUsers();
      setUsers(response.users || []);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch users';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await deleteUser(userId);
      toast.success(response.message || 'User deleted successfully');
      fetchUsers();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete user';
      toast.error(errorMessage);
    }
  };

  const getRoleIcon = (role) => {
    if (role === 'admin') return faShieldHalved;
    if (role === 'manager') return faUserTie;
    return faUser;
  };

  const filteredUsers = users
    .filter(user => filter === 'all' ? true : user.role === filter)
    .filter(user => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return user.name?.toLowerCase().includes(q) || user.email?.toLowerCase().includes(q);
    });

  const stats = {
    total: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    manager: users.filter(u => u.role === 'manager').length,
    employee: users.filter(u => u.role === 'employee').length,
  };

  const filters = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'admin', label: 'Admins', count: stats.admin },
    { key: 'manager', label: 'Managers', count: stats.manager },
    { key: 'employee', label: 'Employees', count: stats.employee },
  ];

  return (
    <div className="space-y-4">
      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-3">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
              filter === f.key
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 bg-white hover:border-gray-400 text-gray-900'
            }`}
          >
            <p className="text-xl sm:text-2xl font-bold">{f.count}</p>
            <p className={`text-xs mt-0.5 ${filter === f.key ? 'text-gray-300' : 'text-gray-500'}`}>{f.label}</p>
          </button>
        ))}
      </div>

      {/* Search + Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Search Bar */}
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="relative">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full sm:w-80 pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-500">{search ? 'No users match your search' : 'No users found'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Role</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Auth</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Joined</th>
                  <th className="text-right py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors group">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-lg border border-gray-200 object-cover shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
                            <FontAwesomeIcon icon={getRoleIcon(user.role)} className="text-xs text-gray-600" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5 hidden sm:table-cell">
                      <span className="text-xs font-medium px-2.5 py-1 rounded border border-gray-200 bg-gray-50 text-gray-700 uppercase">
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-5 hidden md:table-cell">
                      <span className="text-xs text-gray-500">
                        {user.authProvider === 'google' ? 'Google' : 'Email'}
                      </span>
                    </td>
                    <td className="py-3 px-5 hidden lg:table-cell">
                      <span className="text-xs text-gray-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button
                        onClick={() => handleDelete(user._id, user.name)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Delete user"
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-sm" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {!loading && filteredUsers.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {filteredUsers.length} of {users.length} user{users.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;
