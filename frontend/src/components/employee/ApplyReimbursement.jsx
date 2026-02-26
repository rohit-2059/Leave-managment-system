import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPaperPlane,
  faPlane,
  faUtensils,
  faBriefcaseMedical,
  faLaptop,
  faGraduationCap,
  faEllipsis,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { applyReimbursement } from '../../services/reimbursementService';

const categories = [
  { value: 'travel', label: 'Travel', desc: 'Transport & lodging', icon: faPlane },
  { value: 'food', label: 'Food', desc: 'Meals & refreshments', icon: faUtensils },
  { value: 'medical', label: 'Medical', desc: 'Health expenses', icon: faBriefcaseMedical },
  { value: 'equipment', label: 'Equipment', desc: 'Tools & hardware', icon: faLaptop },
  { value: 'training', label: 'Training', desc: 'Courses & certs', icon: faGraduationCap },
  { value: 'other', label: 'Other', desc: 'Anything else', icon: faEllipsis },
];

const ApplyReimbursement = ({ onApplied }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { title, description, amount, category } = formData;

    if (!title.trim() || !description.trim() || !amount || !category) {
      toast.error('Please fill in all fields');
      return;
    }

    if (Number(amount) < 1) {
      toast.error('Amount must be at least ₹1');
      return;
    }

    setLoading(true);
    try {
      const response = await applyReimbursement(title.trim(), description.trim(), Number(amount), category);
      toast.success(response.message || 'Reimbursement submitted successfully');
      setFormData({ title: '', description: '', amount: '', category: '' });
      if (onApplied) onApplied();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit reimbursement');
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

        {/* Section 2: Title */}
        <div className="px-6 py-5 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Title</p>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="E.g. Cab fare for client meeting"
            maxLength={100}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400"
            required
          />
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-[11px] text-gray-400">Short description of the expense</p>
            <p className="text-[11px] text-gray-400">{formData.title.length}/100</p>
          </div>
        </div>

        {/* Section 3: Amount */}
        <div className="px-6 py-5 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Amount (₹)</p>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="Enter amount in rupees"
            min="1"
            step="0.01"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400"
            required
          />
        </div>

        {/* Section 4: Description */}
        <div className="px-6 py-5 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Description</p>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Provide details about the expense, receipts, etc."
            rows={4}
            maxLength={1000}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none placeholder:text-gray-400"
            required
          />
          <p className="text-[11px] text-gray-400 text-right mt-1">{formData.description.length}/1000</p>
        </div>

        {/* Submit */}
        <div className="px-6 py-5">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <FontAwesomeIcon icon={faPaperPlane} />
                Submit Reimbursement
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplyReimbursement;
