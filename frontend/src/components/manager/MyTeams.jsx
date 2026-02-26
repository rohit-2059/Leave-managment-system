import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faUser, faTrash, faEye } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { getMyTeams, deleteTeam } from '../../services/teamService';

const MyTeams = ({ onSelectTeam, refreshTrigger }) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const response = await getMyTeams();
      setTeams(response.teams || []);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch teams';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [refreshTrigger]);

  const handleDelete = async (teamId, teamName) => {
    if (!window.confirm(`Are you sure you want to delete "${teamName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await deleteTeam(teamId);
      toast.success(response.message || 'Team deleted successfully');
      fetchTeams();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete team';
      toast.error(errorMessage);
    }
  };

  return (
    <div>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 text-center py-16 px-6">
          <FontAwesomeIcon icon={faUsers} className="text-4xl text-gray-300 mb-3" />
          <p className="text-gray-600 mb-1">No teams created yet</p>
          <p className="text-sm text-gray-400">Create your first team to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {teams.map((team) => (
            <div
              key={team._id}
              className="bg-white border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm">{team.name}</h3>
                  <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full shrink-0 ml-2">
                    {team.members?.length || 0} member{team.members?.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {team.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{team.description}</p>
                )}

                {/* Member avatars */}
                {team.members?.length > 0 && (
                  <div className="flex items-center mb-3">
                    <div className="flex -space-x-2">
                      {team.members.slice(0, 5).map((member) => (
                        member.avatar ? (
                          <img
                            key={member._id}
                            src={member.avatar}
                            alt={member.name}
                            title={member.name}
                            className="w-7 h-7 rounded-full border-2 border-white"
                          />
                        ) : (
                          <div
                            key={member._id}
                            title={member.name}
                            className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center"
                          >
                            <FontAwesomeIcon icon={faUser} className="text-[9px] text-gray-500" />
                          </div>
                        )
                      ))}
                    </div>
                    {team.members.length > 5 && (
                      <span className="text-[11px] text-gray-400 ml-2">+{team.members.length - 5}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex border-t border-gray-100">
                <button
                  onClick={() => onSelectTeam && onSelectTeam(team._id)}
                  className="flex-1 px-3 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <FontAwesomeIcon icon={faEye} className="text-xs" />
                  Manage
                </button>
                <div className="w-px bg-gray-100"></div>
                <button
                  onClick={() => handleDelete(team._id, team.name)}
                  className="px-4 py-2.5 text-sm text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-xs" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTeams;
