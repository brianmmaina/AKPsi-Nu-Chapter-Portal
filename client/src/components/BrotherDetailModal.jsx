import { useState, useEffect } from 'react';
import { brothers as brothersApi } from '../api';

/**
 * BrotherDetailModal Component
 * 
 * Modal for viewing and editing brother details.
 * Supports keyboard navigation (Escape to close).
 * 
 * @param {Object} props - Component props
 * @param {Object} props.brother - Brother data object
 * @param {number} props.familyId - Family ID
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onUpdate - Update callback after save
 * @param {Object} props.theme - Theme configuration
 * @param {Function} props.onAddLittle - Removed - site is read-only
 * @param {Function} props.onToast - Toast notification handler
 * @returns {JSX.Element} Modal component
 */
const BrotherDetailModal = ({ brother, familyId, onClose, onUpdate, theme, onToast }) => {
  const [isEditing, setIsEditing] = useState(false);
  // Password no longer needed - using JWT tokens for authentication
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

  // Keyboard shortcuts: Escape to close (only when not editing)
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isEditing) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, isEditing]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Token is added automatically via interceptor
      await brothersApi.update(brother.id, { ...formData, is_transfer: formData.is_transfer ? 1 : 0 });
      setIsEditing(false);
      onUpdate();
      onToast?.({ message: 'Brother updated successfully!', type: 'success' });
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update. Please try again.';
      onToast?.({ message: errorMessage, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Add Little functionality removed - site is read-only

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-modal"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="glass-panel-elevated rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{
          padding: 'var(--space-8)',
          backgroundColor: theme?.modalBg || 'var(--surface-elevated)',
          border: `1px solid var(--border)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-6)' }}>
          <h2
            id="modal-title"
            className="font-bold"
            style={{
              fontSize: 'var(--text-2xl)',
              fontFamily: 'var(--font-display)',
              color: theme?.nodeText || 'var(--text)',
            }}
          >
            {isEditing ? 'Edit Brother' : 'Brother Details'}
          </h2>
          <button
            onClick={onClose}
            className="btn btn-sm"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              padding: 'var(--space-1)',
              fontSize: 'var(--text-2xl)',
              lineHeight: '1',
              minWidth: 'auto',
            }}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label className="label" style={{ color: theme?.nodeText || 'var(--text)' }}>
              Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                style={{ color: theme?.nodeText || 'var(--text)' }}
              />
            ) : (
              <p style={{ color: theme?.nodeText || 'var(--text)', fontWeight: 'var(--weight-semibold)' }}>{brother.name}</p>
            )}
          </div>

          <div>
            <label className="label" style={{ color: theme?.nodeText || 'var(--text)' }}>
              Pledge Class
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.pledge_class}
                onChange={(e) => setFormData({ ...formData, pledge_class: e.target.value })}
                className="input"
                style={{ color: theme?.nodeText || 'var(--text)' }}
              />
            ) : (
              <p style={{ color: theme?.nodeText || 'var(--text-muted)' }}>{brother.pledge_class || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="label" style={{ color: theme?.nodeText || 'var(--text)' }}>
              Graduation Year (Class of)
            </label>
            {isEditing ? (
              <input
                type="number"
                value={formData.graduation_year}
                onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value ? parseInt(e.target.value) : '' })}
                className="input"
                style={{ color: theme?.nodeText || 'var(--text)' }}
              />
            ) : (
              <p style={{ color: theme?.nodeText || 'var(--text-muted)' }}>{brother.graduation_year ? `Class of ${brother.graduation_year}` : 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="label" style={{ color: theme?.nodeText || 'var(--text)' }}>
              Major
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                className="input"
                style={{ color: theme?.nodeText || 'var(--text)' }}
              />
            ) : (
              <p style={{ color: theme?.nodeText || 'var(--text-muted)' }}>{brother.major || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="label" style={{ color: theme?.nodeText || 'var(--text)' }}>
              Career Aspirations
            </label>
            {isEditing ? (
              <textarea
                value={formData.career_aspirations}
                onChange={(e) => setFormData({ ...formData, career_aspirations: e.target.value })}
                className="input"
                style={{ color: theme?.nodeText || 'var(--text)', minHeight: '80px', resize: 'vertical' }}
                rows="3"
              />
            ) : (
              <p style={{ color: theme?.nodeText || 'var(--text-muted)' }}>{brother.career_aspirations || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="label" style={{ color: theme?.nodeText || 'var(--text)' }}>
              Fun Facts
            </label>
            {isEditing ? (
              <textarea
                value={formData.fun_facts}
                onChange={(e) => setFormData({ ...formData, fun_facts: e.target.value })}
                className="input"
                style={{ color: theme?.nodeText || 'var(--text)', minHeight: '80px', resize: 'vertical' }}
                rows="3"
              />
            ) : (
              <p style={{ color: theme?.nodeText || 'var(--text-muted)' }}>{brother.fun_facts || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="label" style={{ color: theme?.nodeText || 'var(--text)' }}>
              Status
            </label>
            {isEditing ? (
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input"
                style={{ color: theme?.nodeText || 'var(--text)' }}
              >
                <option value="studying">Currently Studying</option>
                <option value="graduated">Graduated</option>
              </select>
            ) : (
              <p style={{ color: theme?.nodeText || 'var(--text-muted)' }}>
                <span
                  style={{
                    padding: 'var(--space-1) var(--space-2)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: brother.status === 'studying' ? 'var(--success)' : 'var(--text-muted)',
                    color: 'white',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--weight-medium)',
                  }}
                >
                  {brother.status === 'studying' ? 'Currently Studying' : 'Graduated'}
                </span>
              </p>
            )}
          </div>

          {isEditing && (
            <div>
              <label className="label" style={{ color: theme?.nodeText || 'var(--text)' }}>
                Transfer?
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <input
                  type="checkbox"
                  checked={formData.is_transfer}
                  onChange={(e) => setFormData({ ...formData, is_transfer: e.target.checked })}
                />
                <span style={{ color: theme?.nodeText || 'var(--text)' }}>Yes</span>
              </div>
            </div>
          )}

          {/* Password no longer needed - using JWT tokens for authentication */}
        </div>

        <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)' }}>
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-primary flex-1"
              >
                Edit
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary flex-1"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  // Password field removed - using JWT tokens
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
                className="btn btn-secondary flex-1"
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

