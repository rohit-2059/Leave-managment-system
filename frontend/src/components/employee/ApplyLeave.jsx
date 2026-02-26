import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faCalendarDays, faClock } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { applyLeave } from '../../services/leaveService';

const leaveTypes = [
  { value: 'sick', label: 'Sick Leave', desc: 'Medical or health-related' },
  { value: 'casual', label: 'Casual Leave', desc: 'Personal or short notice' },
  { value: 'earned', label: 'Earned Leave', desc: 'Pre-planned / earned days' },
  { value: 'unpaid', label: 'Unpaid Leave', desc: 'Without pay deduction' },
  { value: 'other', label: 'Other', desc: 'Any other reason' },
];

const ApplyLeave = ({ onLeaveApplied }) => {
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { leaveType, startDate, endDate, reason } = formData;

    if (!leaveType || !startDate || !endDate || !reason.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      toast.error('End date cannot be before start date');
      return;
    }

    setLoading(true);
    try {
      const response = await applyLeave(leaveType, startDate, endDate, reason.trim());
      toast.success(response.message || 'Leave request submitted');
      setFormData({ leaveType: '', startDate: '', endDate: '', reason: '' });
      if (onLeaveApplied) onLeaveApplied();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  const getDayCount = () => {
    if (formData.startDate && formData.endDate) {
      const diff = Math.ceil(
        Math.abs(new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)
      ) + 1;
      return diff > 0 ? diff : 0;
    }
    return 0;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const dayCount = getDayCount();

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <form onSubmit={handleSubmit}>
          {/* Section 1: Leave Type */}
          <div className="px-6 py-5 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Leave Type</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {leaveTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, leaveType: type.value })}
                  className={`text-left px-3 py-2.5 rounded-lg border transition-all ${
                    formData.leaveType === type.value
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <p className={`text-sm font-medium ${formData.leaveType === type.value ? 'text-white' : 'text-gray-900'}`}>
                    {type.label}
                  </p>
                  <p className={`text-[11px] mt-0.5 ${formData.leaveType === type.value ? 'text-gray-300' : 'text-gray-400'}`}>
                    {type.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Duration */}
          <div className="px-6 py-5 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Duration</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
                  required
                />
              </div>
            </div>

            {/* Day count summary */}
            {dayCount > 0 && (
              <div className="mt-3 flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faCalendarDays} className="text-xs text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {formatDate(formData.startDate)} — {formatDate(formData.endDate)}
                  </span>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faClock} className="text-xs text-gray-500" />
                  <span className="text-sm font-semibold text-gray-900">
                    {dayCount} day{dayCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Reason */}
          <div className="px-6 py-5 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Reason</p>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Briefly describe why you need this leave..."
              rows={4}
              maxLength={500}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none placeholder:text-gray-400"
              required
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[11px] text-gray-400">Be specific — this helps your manager decide faster</p>
              <p className="text-[11px] text-gray-400">{formData.reason.length}/500</p>
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
                  Submitting...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPaperPlane} className="text-xs" />
                  Submit Request
                </>
              )}
            </button>
          </div>
      </form>
    </div>
  );
};

export default ApplyLeave;
