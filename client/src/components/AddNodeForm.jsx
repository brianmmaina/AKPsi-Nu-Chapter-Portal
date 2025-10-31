import { useState } from 'react';
import { brothers as brothersApi, relationships as relationshipsApi } from '../api';

const AddNodeForm = ({ parentBrother, familyId, onClose, onSuccess, theme, onToast }) => {
  const [password, setPassword] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    pledge_class: '',
    graduation_year: '',
    major: '',
    career_aspirations: '',
    fun_facts: '',
    status: 'studying',
    is_transfer: false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password) {
      alert('Please enter password to add brother');
      return;
    }

    if (!formData.name.trim()) {
      alert('Please enter a name');
      return;
    }

    setSaving(true);
    try {
      // Create the brother
      const response = await brothersApi.create(
        {
          family_id: familyId,
          big_id: parentBrother ? parentBrother.id : null,
          ...formData,
          graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null,
          is_transfer: formData.is_transfer ? 1 : 0,
        },
        password
      );

      const newBrotherId = response.data.id;

      // Create relationship if there's a parent
      if (parentBrother) {
        await relationshipsApi.create(
          {
            family_id: familyId,
            big_id: parentBrother.id,
            little_id: newBrotherId,
          },
          password
        );
      }

      onSuccess();
      onClose();
      onToast?.({ message: 'Brother added successfully!', type: 'success' });
    } catch (error) {
      onToast?.({ message: 'Failed to add brother. Please check your password.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-sm shadow-xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto border-4 border-black"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-black" style={{ fontFamily: "'PT Serif', serif" }}>
            Add New Brother
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black text-3xl font-light leading-none"
          >
            ×
          </button>
        </div>

        {parentBrother && (
          <div className="mb-4 p-3 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <p className="text-sm text-gray-600">Adding as Little of:</p>
            <p className="text-gray-900 font-semibold">{parentBrother.name}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-white text-gray-900 rounded-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Pledge Class
            </label>
            <input
              type="text"
              value={formData.pledge_class}
              onChange={(e) => setFormData({ ...formData, pledge_class: e.target.value })}
              className="w-full px-4 py-2 bg-white text-gray-900 rounded-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Graduation Year (Class of)
            </label>
            <input
              type="number"
              value={formData.graduation_year}
              onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
              className="w-full px-4 py-2 bg-white text-gray-900 rounded-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Major
            </label>
            <input
              type="text"
              value={formData.major}
              onChange={(e) => setFormData({ ...formData, major: e.target.value })}
              className="w-full px-4 py-2 bg-white text-gray-900 rounded-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Career Aspirations
            </label>
            <textarea
              value={formData.career_aspirations}
              onChange={(e) => setFormData({ ...formData, career_aspirations: e.target.value })}
              className="w-full px-4 py-2 bg-white text-gray-900 rounded-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Fun Facts
            </label>
            <textarea
              value={formData.fun_facts}
              onChange={(e) => setFormData({ ...formData, fun_facts: e.target.value })}
              className="w-full px-4 py-2 bg-white text-gray-900 rounded-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 bg-white text-gray-900 rounded-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
            >
              <option value="studying">Currently Studying</option>
              <option value="graduated">Graduated</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Transfer?
            </label>
            <input
              type="checkbox"
              checked={formData.is_transfer}
              onChange={(e) => setFormData({ ...formData, is_transfer: e.target.checked })}
              className="mr-2"
            />
            <span className="text-gray-700">Yes</span>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-white text-gray-900 rounded-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
              placeholder="Enter password"
              required
            />
          </div>

          <div className="mt-6 flex space-x-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-sm font-medium transition disabled:opacity-50 bg-black text-white hover:bg-gray-800 border-2 border-black"
            >
              {saving ? 'Adding...' : 'Add Brother'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white text-gray-900 rounded-sm font-medium hover:bg-gray-50 transition border-2 border-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNodeForm;

