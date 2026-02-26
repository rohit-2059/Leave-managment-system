import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faPlus } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { createTeam } from '../../services/teamService';

const CreateTeam = ({ onTeamCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || formData.name.length < 2) {
      toast.error('Team name must be at least 2 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await createTeam(formData.name, formData.description);
      toast.success(response.message || 'Team created successfully');
      setFormData({ name: '', description: '' });
      if (onTeamCreated) {
        onTeamCreated();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create team';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <form onSubmit={handleSubmit}>
        {/* Team Name */}
        <div className="px-6 py-5 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Team Name</p>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="e.g. Frontend Squad, Design Team"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400"
            required
            minLength={2}
            maxLength={50}
          />
          <p className="text-[11px] text-gray-400 mt-1.5">2–50 characters</p>
        </div>

        {/* Description */}
        <div className="px-6 py-5 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Description</p>
          <textarea
            id="description"
            name="description"
            placeholder="What does this team work on? (optional)"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            maxLength={200}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none placeholder:text-gray-400"
          />
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-[11px] text-gray-400">Optional — helps identify the team</p>
            <p className="text-[11px] text-gray-400">{formData.description.length}/200</p>
          </div>
        </div>

        {/* Submit */}
        <div className="px-6 py-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPlus} className="text-xs" />
                Create Team
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTeam;
