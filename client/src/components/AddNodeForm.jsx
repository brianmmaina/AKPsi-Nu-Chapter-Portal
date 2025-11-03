import { useState, useEffect } from 'react';
import { brothers as brothersApi, relationships as relationshipsApi } from '../api';

/**
 * AddNodeForm Component
 * 
 * Modal form for adding a new brother (Little) to the family tree.
 * Supports keyboard navigation (Escape to close).
 * 
 * @param {Object} props - Component props
 * @param {Object} props.parentBrother - Initial parent brother (Big) object, or null for root (can be changed)
 * @param {Array<Object>} props.existingBrothers - List of existing brothers to choose from as Big
 * @param {number} props.familyId - Family ID
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onSuccess - Success callback
 * @param {Object} props.theme - Theme configuration
 * @param {Function} props.onToast - Toast notification handler
 * @returns {JSX.Element} Add brother form modal
 */
const AddNodeForm = ({ parentBrother, existingBrothers = [], familyId, onClose, onSuccess, theme, onToast }) => {
  // Keyboard shortcuts: Escape to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);
  const [password, setPassword] = useState('');
  const [selectedBigId, setSelectedBigId] = useState(parentBrother?.id || null);
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
    
    if (!password.trim()) {
      onToast?.({ message: 'Password is required to add a brother', type: 'error' });
      return;
    }

    if (!formData.name.trim()) {
      onToast?.({ message: 'Please enter a name', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      // Use selectedBigId from dropdown (or null for root)
      // Handle both string and number types
      const bigIdToUse = (selectedBigId === '' || selectedBigId === null || selectedBigId === undefined) 
        ? null 
        : (typeof selectedBigId === 'number' ? selectedBigId : parseInt(selectedBigId, 10));
      
      console.log('Submitting form with:', { 
        family_id: familyId, 
        big_id: bigIdToUse, 
        name: formData.name,
        hasPassword: !!password 
      });
      
      // Create the brother
      const response = await brothersApi.create(
        {
          family_id: familyId,
          big_id: bigIdToUse,
          ...formData,
          graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null,
          is_transfer: formData.is_transfer ? 1 : 0,
        },
        password
      );

      const newBrotherId = response.data.id;
      console.log('Brother created successfully with ID:', newBrotherId);

      // Create relationship if there's a parent selected
      if (bigIdToUse && !isNaN(bigIdToUse) && bigIdToUse > 0) {
        try {
          await relationshipsApi.create(
            {
              family_id: familyId,
              big_id: bigIdToUse,
              little_id: newBrotherId,
            },
            password
          );
          console.log('Relationship created successfully');
        } catch (relError) {
          console.error('Relationship creation failed (brother still created):', relError);
          // Don't fail the whole request if relationship creation fails
        }
      }

      // Close modal first, then refresh
      onClose();
      onToast?.({ message: 'Brother added successfully!', type: 'success' });
      
      // Call onSuccess after closing to refresh the tree (with delay to ensure modal closes)
      if (onSuccess) {
        setTimeout(() => {
          try {
            onSuccess();
          } catch (refreshError) {
            console.error('Error refreshing tree:', refreshError);
            // Don't show error to user - they already got success message
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error adding brother:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      const errorMessage = error.response?.data?.error || error.message || 'Failed to add brother. Please check your password and try again.';
      onToast?.({ 
        message: `Error: ${errorMessage}`, 
        type: 'error' 
      });
    } finally {
      setSaving(false);
    }
  };

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
      aria-labelledby="add-modal-title"
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
            id="add-modal-title"
            className="font-bold"
            style={{
              fontSize: 'var(--text-2xl)',
              fontFamily: 'var(--font-display)',
              color: theme?.nodeText || 'var(--text)',
            }}
          >
            Add New Brother
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label className="label label-required" style={{ color: theme?.nodeText || 'var(--text)' }}>
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
              autoFocus
              style={{ 
                color: '#1f1f1f',
                backgroundColor: '#ffffff',
                borderColor: '#d0d0d0',
              }}
            />
          </div>

          <div>
            <label className="label label-required" style={{ color: theme?.nodeText || '#1f1f1f', fontWeight: '600', fontSize: 'var(--text-base)' }}>
              Big Brother (Parent) - Choose relationship
            </label>
            <select
              value={selectedBigId || ''}
              onChange={(e) => setSelectedBigId(e.target.value === '' ? null : parseInt(e.target.value, 10))}
              className="input"
              style={{ 
                color: '#1f1f1f',
                backgroundColor: '#ffffff',
                borderColor: '#d0d0d0',
                fontWeight: '500',
              }}
            >
              <option value="">None (Root Node - starts new branch)</option>
              {existingBrothers.length > 0 ? (
                existingBrothers.map((brother) => (
                  <option key={brother.id} value={brother.id}>
                    {brother.name} {brother.pledge_class ? `(${brother.pledge_class})` : ''}
                  </option>
                ))
              ) : (
                <option value="" disabled>No brothers available yet</option>
              )}
            </select>
            {selectedBigId && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
                This brother will be added as a Little of the selected Big Brother
              </p>
            )}
            {!selectedBigId && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
                Root node - this brother will start a new branch in the family tree
              </p>
            )}
          </div>

          <div>
            <label className="label" style={{ color: theme?.nodeText || 'var(--text)' }}>
              Pledge Class
            </label>
            <input
              type="text"
              value={formData.pledge_class}
              onChange={(e) => setFormData({ ...formData, pledge_class: e.target.value })}
              className="input"
              style={{ 
                color: '#1f1f1f',
                backgroundColor: '#ffffff',
                borderColor: '#d0d0d0',
              }}
            />
          </div>

          <div>
            <label className="label" style={{ color: theme?.nodeText || 'var(--text)' }}>
              Graduation Year (Class of)
            </label>
            <input
              type="number"
              value={formData.graduation_year}
              onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
              className="input"
              style={{ 
                color: '#1f1f1f',
                backgroundColor: '#ffffff',
                borderColor: '#d0d0d0',
              }}
            />
          </div>

          <div>
            <label className="label" style={{ color: theme?.nodeText || 'var(--text)' }}>
              Major
            </label>
            <input
              type="text"
              value={formData.major}
              onChange={(e) => setFormData({ ...formData, major: e.target.value })}
              className="input"
              style={{ 
                color: '#1f1f1f',
                backgroundColor: '#ffffff',
                borderColor: '#d0d0d0',
              }}
            />
          </div>

          <div>
            <label className="label" style={{ color: theme?.nodeText || 'var(--text)' }}>
              Career Aspirations
            </label>
            <textarea
              value={formData.career_aspirations}
              onChange={(e) => setFormData({ ...formData, career_aspirations: e.target.value })}
              className="input"
              rows="3"
              style={{ 
                color: '#1f1f1f',
                backgroundColor: '#ffffff',
                borderColor: '#d0d0d0',
                minHeight: '80px', 
                resize: 'vertical',
              }}
            />
          </div>

          <div>
            <label className="label" style={{ color: theme?.nodeText || 'var(--text)' }}>
              Fun Facts
            </label>
            <textarea
              value={formData.fun_facts}
              onChange={(e) => setFormData({ ...formData, fun_facts: e.target.value })}
              className="input"
              rows="3"
              style={{ 
                color: '#1f1f1f',
                backgroundColor: '#ffffff',
                borderColor: '#d0d0d0',
                minHeight: '80px', 
                resize: 'vertical',
              }}
            />
          </div>

          <div>
            <label className="label" style={{ color: theme?.nodeText || 'var(--text)' }}>
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="input"
              style={{ 
                color: '#1f1f1f',
                backgroundColor: '#ffffff',
                borderColor: '#d0d0d0',
              }}
            >
              <option value="studying">Currently Studying</option>
              <option value="graduated">Graduated</option>
            </select>
          </div>

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

          <div>
            <label className="label label-required" style={{ color: theme?.nodeText || 'var(--text)' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="Enter password"
              required
              style={{ 
                color: '#1f1f1f',
                backgroundColor: '#ffffff',
                borderColor: '#d0d0d0',
              }}
            />
          </div>

          <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)' }}>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary flex-1"
            >
              {saving 
                ? 'Adding...' 
                : selectedBigId 
                  ? 'Add Little Brother' 
                  : 'Add Root Brother'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
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

