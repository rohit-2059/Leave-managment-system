import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPaperPlane,
  faBriefcase,
  faShieldHalved,
  faWeightHanging,
  faMoneyBill,
  faCalendarXmark,
  faEllipsis,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { raiseComplaint } from '../../services/complaintService';

const categories = [
  { value: 'workplace', label: 'Workplace', desc: 'Office environment issue', icon: faBriefcase },
  { value: 'harassment', label: 'Harassment', desc: 'Bullying or misconduct', icon: faShieldHalved },
  { value: 'workload', label: 'Workload', desc: 'Task or pressure related', icon: faWeightHanging },
  { value: 'salary', label: 'Salary', desc: 'Pay & compensation', icon: faMoneyBill },
  { value: 'leave', label: 'Leave', desc: 'Leave-related concern', icon: faCalendarXmark },
  { value: 'other', label: 'Other', desc: 'Anything else', icon: faEllipsis },
];

const RaiseComplaint = ({ onComplaintRaised }) => {
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { subject, description, category } = formData;

    if (!subject.trim() || !description.trim() || !category) {
      toast.error('Please fill in all fields');
      return;
    }

    if (subject.trim().length < 3) {
      toast.error('Subject must be at least 3 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await raiseComplaint(subject.trim(), description.trim(), category);
      toast.success(response.message || 'Complaint submitted successfully');
      setFormData({ subject: '', description: '', category: '' });
      if (onComplaintRaised) onComplaintRaised();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <form onSubmit={handleSubmit}>
          {/* Section 1: Category */}
          <div className="px-6 py-5 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Category</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.value })}
                  className={`text-left px-3 py-2.5 rounded-lg border transition-all ${
                    formData.category === cat.value
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <FontAwesomeIcon
                      icon={cat.icon}
                      className={`text-[11px] ${formData.category === cat.value ? 'text-gray-300' : 'text-gray-400'}`}
                    />
                    <p className={`text-sm font-medium ${formData.category === cat.value ? 'text-white' : 'text-gray-900'}`}>
                      {cat.label}
                    </p>
                  </div>
                  <p className={`text-[11px] ml-5 ${formData.category === cat.value ? 'text-gray-300' : 'text-gray-400'}`}>
                    {cat.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Subject */}
          <div className="px-6 py-5 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Subject</p>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="A short title for your complaint"
              maxLength={100}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400"
              required
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[11px] text-gray-400">Keep it concise and descriptive</p>
              <p className="text-[11px] text-gray-400">{formData.subject.length}/100</p>
            </div>
          </div>

          {/* Section 3: Description */}
          <div className="px-6 py-5 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Description</p>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Explain the issue in detail — what happened, when, and any context that helps..."
              rows={5}
              maxLength={1000}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none placeholder:text-gray-400"
              required
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[11px] text-gray-400">The more detail you provide, the faster it can be resolved</p>
              <p className="text-[11px] text-gray-400">{formData.description.length}/1000</p>
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
                  Submit Complaint
                </>
              )}
            </button>
          </div>
      </form>
    </div>
  );
};

export default RaiseComplaint;
