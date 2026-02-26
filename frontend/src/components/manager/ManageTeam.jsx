import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faUser, faUserPlus, faUserMinus, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { getTeamById, addMemberToTeam, removeMemberFromTeam } from '../../services/teamService';
import { getAllEmployees } from '../../services/userService';

const ManageTeam = ({ teamId, onBack }) => {
  const [team, setTeam] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teamResponse, employeesResponse] = await Promise.all([
        getTeamById(teamId),
        getAllEmployees()
      ]);
      setTeam(teamResponse.team);
      setAllEmployees(employeesResponse.employees || []);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch data';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teamId) {
      fetchData();
    }
  }, [teamId]);

  const handleAddMember = async (employeeId, employeeName) => {
    setActionLoading(true);
    try {
      const response = await addMemberToTeam(teamId, employeeId);
      toast.success(response.message || `${employeeName} added to team`);
      fetchData();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add member';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (employeeId, employeeName) => {
    if (!window.confirm(`Remove ${employeeName} from this team?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await removeMemberFromTeam(teamId, employeeId);
      toast.success(response.message || `${employeeName} removed from team`);
      fetchData();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to remove member';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const availableEmployees = allEmployees.filter(
    (emp) => !team?.members?.some((member) => member._id === emp._id)
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-center text-gray-600">Team not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <button
          onClick={onBack}
          className="mb-4 text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Back to Teams
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
            <FontAwesomeIcon icon={faUsers} className="text-xl text-gray-700" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{team.name}</h2>
            {team.description && (
              <p className="text-sm text-gray-600">{team.description}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {team.members?.length || 0} member{team.members?.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Current Members */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faUsers} />
            Team Members ({team.members?.length || 0})
          </h3>
          {!team.members || team.members.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <FontAwesomeIcon icon={faUser} className="text-3xl text-gray-400 mb-2" />
              <p className="text-gray-600 text-sm">No members yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {team.members.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-10 h-10 rounded-lg border border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                        <FontAwesomeIcon icon={faUser} className="text-gray-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-600">{member.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(member._id, member.name)}
                    disabled={actionLoading}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={faUserMinus} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Employees */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faUserPlus} />
            Add Members ({availableEmployees.length} available)
          </h3>
          {availableEmployees.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <FontAwesomeIcon icon={faUser} className="text-3xl text-gray-400 mb-2" />
              <p className="text-gray-600 text-sm">All employees are in this team</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableEmployees.map((employee) => (
                <div
                  key={employee._id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {employee.avatar ? (
                      <img
                        src={employee.avatar}
                        alt={employee.name}
                        className="w-10 h-10 rounded-lg border border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                        <FontAwesomeIcon icon={faUser} className="text-gray-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{employee.name}</p>
                      <p className="text-xs text-gray-600">{employee.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddMember(employee._id, employee.name)}
                    disabled={actionLoading}
                    className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                    Add
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

export default ManageTeam;
