import { useState } from 'react';
import { brothers as brothersApi } from '../api';

const BrotherDetailModal = ({ brother, familyId, onClose, onUpdate, theme, onAddLittle, onToast }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [password, setPassword] = useState('');
  const [formData, setFormData] = useState({
    name: brother.name,
    pledge_class: brother.pledge_class || '',
    graduation_year: brother.graduation_year || '',
    major: brother.major || '',
    career_aspirations: brother.career_aspirations || '',
    fun_facts: brother.fun_facts || '',
    status: brother.status,
    is_transfer: brother.is_transfer === 1,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!password) {
      alert('Please enter password to save changes');
      return;
    }

    setSaving(true);
    try {
      await brothersApi.update(brother.id, { ...formData, is_transfer: formData.is_transfer ? 1 : 0 }, password);
      setIsEditing(false);
      setPassword('');
      onUpdate();
      onToast?.({ message: 'Brother updated successfully!', type: 'success' });
    } catch (error) {
      onToast?.({ message: 'Failed to update. Please check your password.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddLittleClick = () => {
    onClose();
    // The parent will be set in TreeVisualization
    onAddLittle();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-sm shadow-xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto border-4 border-black"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-black" style={{ fontFamily: "'PT Serif', serif" }}>
            {isEditing ? 'Edit Brother' : 'Brother Details'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black text-3xl font-light leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-white text-gray-900 rounded-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
              />
            ) : (
              <p className="text-gray-900 font-semibold">{brother.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Pledge Class
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.pledge_class}
                onChange={(e) => setFormData({ ...formData, pledge_class: e.target.value })}
                className="w-full px-4 py-2 bg-white text-gray-900 rounded-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
              />
            ) : (
              <p className="text-gray-700">{brother.pledge_class || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Graduation Year (Class of)
            </label>
            {isEditing ? (
              <input
                type="number"
                value={formData.graduation_year}
                onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value ? parseInt(e.target.value) : '' })}
                className="w-full px-4 py-2 bg-white text-gray-900 rounded-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
              />
            ) : (
              <p className="text-gray-700">{brother.graduation_year ? `Class of ${brother.graduation_year}` : 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Major
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                className="w-full px-4 py-2 bg-white text-gray-900 rounded-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
              />
            ) : (
              <p className="text-gray-700">{brother.major || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Career Aspirations
            </label>
            {isEditing ? (
              <textarea
                value={formData.career_aspirations}
                onChange={(e) => setFormData({ ...formData, career_aspirations: e.target.value })}
                className="w-full px-4 py-2 bg-white text-gray-900 rounded-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                rows="3"
              />
            ) : (
              <p className="text-gray-700">{brother.career_aspirations || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Fun Facts
            </label>
            {isEditing ? (
              <textarea
                value={formData.fun_facts}
                onChange={(e) => setFormData({ ...formData, fun_facts: e.target.value })}
                className="w-full px-4 py-2 bg-white text-gray-900 rounded-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                rows="3"
              />
            ) : (
              <p className="text-gray-700">{brother.fun_facts || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Status
            </label>
            {isEditing ? (
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 bg-white text-gray-900 rounded-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
              >
                <option value="studying">Currently Studying</option>
                <option value="graduated">Graduated</option>
              </select>
            ) : (
              <p className="text-gray-700">
                <span className={`px-2 py-1 rounded ${brother.status === 'studying' ? 'bg-green-600' : 'bg-gray-600'}`}>
                  {brother.status === 'studying' ? 'Currently Studying' : 'Graduated'}
                </span>
              </p>
            )}
          </div>

          {isEditing && (
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
          )}

          {isEditing && (
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Password (required to save)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-white text-gray-900 rounded-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                placeholder="Enter password"
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex space-x-3">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 px-4 py-2 rounded-sm font-medium transition bg-black text-white hover:bg-gray-800 border-2 border-black"
              >
                Edit
              </button>
              <button
                onClick={handleAddLittleClick}
                className="flex-1 px-4 py-2 rounded-sm font-medium transition bg-black text-white hover:bg-gray-800 border-2 border-black"
              >
                Add Little
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 rounded-sm font-medium transition disabled:opacity-50 bg-black text-white hover:bg-gray-800 border-2 border-black"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setPassword('');
                  setFormData({
                    name: brother.name,
                    pledge_class: brother.pledge_class || '',
                    graduation_year: brother.graduation_year || '',
                    major: brother.major || '',
                    career_aspirations: brother.career_aspirations || '',
                    fun_facts: brother.fun_facts || '',
                    status: brother.status,
                    is_transfer: brother.is_transfer === 1,
                  });
                }}
                className="flex-1 px-4 py-2 bg-white text-gray-900 rounded-sm font-medium hover:bg-gray-50 transition border-2 border-gray-300"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrotherDetailModal;

