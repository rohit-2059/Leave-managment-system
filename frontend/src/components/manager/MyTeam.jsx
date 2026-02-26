import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faUsers, faUserMinus } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { getMyTeam, removeEmployee } from '../../services/userService';

const MyTeam = () => {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const response = await getMyTeam();
      setTeam(response.team || []);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch team';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (employeeId, employeeName) => {
    if (!window.confirm(`Remove ${employeeName} from your team?`)) {
      return;
    }

    try {
      const response = await removeEmployee(employeeId);
      toast.success(response.message || `${employeeName} removed from team`);
      fetchTeam(); // Refresh list
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to remove employee';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-[#e8e0d4] p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <FontAwesomeIcon icon={faUsers} className="text-lg sm:text-xl text-blue-700" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl font-bold text-[#1b4332]">My Team</h2>
          <p className="text-xs sm:text-sm text-[#8a7e6b]">Manage your team members</p>
        </div>
      </div>

      {/* Team Stats */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-blue-600 font-medium">Total Team Members</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-800 mt-1">{team.length}</p>
          </div>
          <FontAwesomeIcon icon={faUsers} className="text-3xl sm:text-4xl text-blue-300" />
        </div>
      </div>

      {/* Team List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#2d6a4f] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : team.length === 0 ? (
        <div className="text-center py-12 bg-[#faf8f4] rounded-xl border border-[#e8e0d4]">
          <FontAwesomeIcon icon={faUsers} className="text-4xl text-[#8a7e6b] mb-3" />
          <p className="text-[#8a7e6b] mb-2">No team members yet</p>
          <p className="text-xs text-[#a89f8f]">Go to "Assign Employees" to build your team</p>
        </div>
      ) : (
        <div className="space-y-3">
          {team.map((employee) => (
            <div
              key={employee._id}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
            >
              <div className="flex items-center gap-3 flex-1 w-full">
                {employee.avatar ? (
                  <img
                    src={employee.avatar}
                    alt={employee.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border border-gray-200 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border border-gray-200 bg-white flex items-center justify-center shrink-0">
                    <FontAwesomeIcon icon={faUser} className="text-gray-700" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                    {employee.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">{employee.email}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded border border-gray-300 bg-white text-gray-700">
                      Employee
                    </span>
                    <span className="text-[10px] sm:text-xs text-gray-600">
                      {employee.authProvider === 'google' ? 'Google' : 'Local'}
                    </span>
                    <span className="text-[10px] sm:text-xs text-gray-600">
                      Joined {new Date(employee.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleRemove(employee._id, employee.name)}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-white text-gray-700 text-sm font-medium
                           hover:bg-gray-100 active:bg-gray-200 border border-gray-300
                           transition-all flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={faUserMinus} />
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTeam;
