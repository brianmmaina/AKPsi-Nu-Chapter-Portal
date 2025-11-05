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
    profile_image_url: brother.profile_image_url || '',
    linkedin_url: brother.linkedin_url || '',
    instagram_url: brother.instagram_url || '',
    personal_website_url: brother.personal_website_url || '',
    email: brother.email || '',
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
      await brothersApi.update(brother.id, { 
        ...formData, 
        is_transfer: formData.is_transfer ? 1 : 0, 
        profile_image_url: formData.profile_image_url,
        linkedin_url: formData.linkedin_url,
        instagram_url: formData.instagram_url,
        personal_website_url: formData.personal_website_url,
        email: formData.email,
      });
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
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="glass-panel-elevated rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: theme?.modalBg || 'var(--surface-elevated)',
          border: `1px solid var(--border)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="flex justify-end items-center" style={{ padding: 'var(--space-4)', paddingBottom: 0 }}>
          <button
            onClick={onClose}
            className="btn btn-sm"
            style={{
              background: 'rgba(0, 0, 0, 0.1)',
              border: 'none',
              color: theme?.nodeText || 'var(--text)',
              padding: 'var(--space-2) var(--space-3)',
              fontSize: 'var(--text-xl)',
              lineHeight: '1',
              minWidth: 'auto',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
            }}
            aria-label="Close profile"
          >
            ×
          </button>
        </div>

        {/* Profile Content */}
        <div style={{ padding: 'var(--space-6)', paddingTop: 'var(--space-4)' }}>
          {!isEditing ? (
            /* View Mode - Beautiful Profile Layout */
            <>
              {/* Headshot Section */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-6)' }}>
                {brother.profile_image_url ? (
                  <img
                    src={brother.profile_image_url}
                    alt={brother.name}
                    style={{
                      width: '200px',
                      height: '200px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: `4px solid ${theme?.accent || '#c9a857'}`,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '200px',
                      height: '200px',
                      borderRadius: '50%',
                      backgroundColor: theme?.accent || '#c9a857',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '48px',
                      fontWeight: 'bold',
                      border: `4px solid ${theme?.accent || '#c9a857'}`,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    }}
                  >
                    {brother.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name */}
              <h1
                id="modal-title"
                style={{
                  fontSize: '36px',
                  fontFamily: theme?.titleFont || 'var(--font-display)',
                  color: theme?.nodeText || 'var(--text)',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  marginBottom: 'var(--space-2)',
                  textTransform: 'capitalize',
                }}
              >
                {brother.name}
              </h1>

              {/* Key Info Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
                {brother.pledge_class && (
                  <span
                    style={{
                      padding: '8px 16px',
                      backgroundColor: theme?.accent || '#c9a857',
                      color: 'white',
                      borderRadius: '0px',
                      fontSize: '12px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      border: `2px solid ${theme?.accent || '#c9a857'}`,
                    }}
                  >
                    {brother.pledge_class}
                  </span>
                )}
                {brother.graduation_year && (
                  <span
                    style={{
                      padding: '8px 16px',
                      backgroundColor: theme?.background || '#f8f7f3',
                      color: theme?.nodeText || 'var(--text)',
                      border: `2px solid ${theme?.accent || '#c9a857'}`,
                      borderRadius: '0px',
                      fontSize: '12px',
                      fontWeight: '700',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Class of {brother.graduation_year}
                  </span>
                )}
                <span
                  style={{
                    padding: '8px 16px',
                    backgroundColor: brother.status === 'studying' ? '#10b981' : '#6b7280',
                    color: 'white',
                    borderRadius: '0px',
                    fontSize: '12px',
                    fontWeight: '700',
                    letterSpacing: '0.5px',
                    border: `2px solid ${brother.status === 'studying' ? '#10b981' : '#6b7280'}`,
                  }}
                >
                  {brother.status === 'studying' ? 'Currently Studying' : 'Graduated'}
                </span>
              </div>

              {/* Major */}
              {brother.major && (
                <div style={{ 
                  textAlign: 'center', 
                  marginBottom: 'var(--space-6)',
                  padding: 'var(--space-4)',
                  backgroundColor: theme?.background || '#f8f7f3',
                  border: `1px solid ${theme?.nodeBorder || '#d4c9b3'}`,
                  borderRadius: '0px',
                }}>
                  <p style={{ 
                    color: theme?.nodeText || 'var(--text)', 
                    fontSize: 'var(--text-base)', 
                    fontWeight: '500',
                    margin: 0,
                  }}>
                    {brother.major}
                  </p>
                </div>
              )}

              {/* Career Aspirations */}
              {brother.career_aspirations && (
                <div style={{ 
                  marginBottom: 'var(--space-6)',
                  padding: 'var(--space-5)',
                  backgroundColor: theme?.background || '#f8f7f3',
                  border: `2px solid ${theme?.accent || '#c9a857'}`,
                  borderRadius: '0px',
                }}>
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: '700', 
                    color: theme?.nodeText || 'var(--text)',
                    marginBottom: 'var(--space-3)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontSize: '12px',
                  }}>
                    Career Aspirations
                  </h3>
                  <p style={{ 
                    color: theme?.nodeText || 'var(--text)', 
                    lineHeight: '1.7',
                    fontSize: '15px',
                    margin: 0,
                  }}>
                    {brother.career_aspirations}
                  </p>
                </div>
              )}

              {/* Description (Fun Facts) */}
              {brother.fun_facts && (
                <div style={{ 
                  marginBottom: 'var(--space-6)',
                  padding: 'var(--space-5)',
                  backgroundColor: theme?.background || '#f8f7f3',
                  border: `2px solid ${theme?.accent || '#c9a857'}`,
                  borderRadius: '0px',
                }}>
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: '700', 
                    color: theme?.nodeText || 'var(--text)',
                    marginBottom: 'var(--space-3)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontSize: '12px',
                  }}>
                    About
                  </h3>
                  <p style={{ 
                    color: theme?.nodeText || 'var(--text)', 
                    lineHeight: '1.7',
                    fontSize: '15px',
                    margin: 0,
                  }}>
                    {brother.fun_facts}
                  </p>
                </div>
              )}

              {/* Links Section */}
              {(brother.linkedin_url || brother.instagram_url || brother.personal_website_url || brother.email) && (
                <div style={{ 
                  marginBottom: 'var(--space-6)',
                  padding: 'var(--space-5)',
                  backgroundColor: theme?.background || '#f8f7f3',
                  border: `2px solid ${theme?.accent || '#c9a857'}`,
                  borderRadius: '0px',
                }}>
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: '700', 
                    color: theme?.nodeText || 'var(--text)',
                    marginBottom: 'var(--space-4)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontSize: '12px',
                  }}>
                    Connect
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', justifyContent: 'center' }}>
                    {brother.linkedin_url && (
                      <a
                        href={brother.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 16px',
                          backgroundColor: '#0077b5',
                          color: 'white',
                          borderRadius: '0px',
                          textDecoration: 'none',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,119,181,0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <span>🔗</span> LinkedIn
                      </a>
                    )}
                    {brother.instagram_url && (
                      <a
                        href={brother.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 16px',
                          background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
                          color: 'white',
                          borderRadius: '0px',
                          textDecoration: 'none',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(225,48,108,0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <span>📷</span> Instagram
                      </a>
                    )}
                    {brother.personal_website_url && (
                      <a
                        href={brother.personal_website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 16px',
                          backgroundColor: theme?.accent || '#c9a857',
                          color: 'white',
                          borderRadius: '0px',
                          textDecoration: 'none',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = `0 4px 12px ${theme?.accent || '#c9a857'}40`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <span>🌐</span> Website
                      </a>
                    )}
                    {brother.email && (
                      <a
                        href={`mailto:${brother.email}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 16px',
                          backgroundColor: '#6b7280',
                          color: 'white',
                          borderRadius: '0px',
                          textDecoration: 'none',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(107,114,128,0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <span>✉️</span> Email
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Edit Button */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-6)' }}>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-primary"
                  style={{
                    padding: 'var(--space-3) var(--space-6)',
                  }}
                >
                  Edit Profile
                </button>
              </div>
            </>
          ) : (
            /* Edit Mode - Form Layout */
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

              <div style={{ 
                padding: 'var(--space-4)', 
                backgroundColor: theme?.background || '#f8f7f3',
                border: `2px solid ${theme?.accent || '#c9a857'}`,
                borderRadius: '0px',
                marginBottom: 'var(--space-4)',
              }}>
                <label className="label" style={{ color: theme?.nodeText || 'var(--text)', fontWeight: '600', fontSize: 'var(--text-base)' }}>
                  Profile Image URL
                </label>
                <input
                  type="text"
                  value={formData.profile_image_url}
                  onChange={(e) => setFormData({ ...formData, profile_image_url: e.target.value })}
                  className="input"
                  placeholder="https://example.com/image.jpg"
                  style={{ 
                    color: theme?.nodeText || 'var(--text)',
                    border: `2px solid ${theme?.accent || '#c9a857'}`,
                    borderRadius: '0px',
                    padding: 'var(--space-3)',
                    fontSize: 'var(--text-base)',
                  }}
                />
                <small style={{ color: theme?.nodeText || 'var(--text-muted)', fontSize: 'var(--text-sm)', display: 'block', marginTop: 'var(--space-2)' }}>
                  Enter a URL to an image for the profile headshot (e.g., from Imgur, Google Drive, or any image hosting service)
                </small>
              </div>

              {/* Links Section */}
              <div style={{ 
                padding: 'var(--space-4)', 
                backgroundColor: theme?.background || '#f8f7f3',
                border: `2px solid ${theme?.accent || '#c9a857'}`,
                borderRadius: '0px',
                marginBottom: 'var(--space-4)',
              }}>
                <h3 style={{ 
                  fontSize: 'var(--text-lg)', 
                  fontWeight: '600', 
                  color: theme?.nodeText || 'var(--text)',
                  marginBottom: 'var(--space-3)',
                }}>
                  Links & Contact
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div>
                    <label className="label" style={{ color: theme?.nodeText || 'var(--text)' }}>
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={formData.linkedin_url}
                      onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                      className="input"
                      placeholder="https://linkedin.com/in/username"
                      style={{ 
                        color: theme?.nodeText || 'var(--text)',
                        borderRadius: '0px',
                      }}
                    />
                  </div>

                  <div>
                    <label className="label" style={{ color: theme?.nodeText || 'var(--text)' }}>
                      Instagram URL
                    </label>
                    <input
                      type="url"
                      value={formData.instagram_url}
                      onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                      className="input"
                      placeholder="https://instagram.com/username"
                      style={{ 
                        color: theme?.nodeText || 'var(--text)',
                        borderRadius: '0px',
                      }}
                    />
                  </div>

                  <div>
                    <label className="label" style={{ color: theme?.nodeText || 'var(--text)' }}>
                      Personal Website URL
                    </label>
                    <input
                      type="url"
                      value={formData.personal_website_url}
                      onChange={(e) => setFormData({ ...formData, personal_website_url: e.target.value })}
                      className="input"
                      placeholder="https://yourwebsite.com"
                      style={{ 
                        color: theme?.nodeText || 'var(--text)',
                        borderRadius: '0px',
                      }}
                    />
                  </div>

                  <div>
                    <label className="label" style={{ color: theme?.nodeText || 'var(--text)' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input"
                      placeholder="example@email.com"
                      style={{ 
                        color: theme?.nodeText || 'var(--text)',
                        borderRadius: '0px',
                      }}
                    />
                  </div>
                </div>
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
            </div>
          )}

          {/* Action Buttons - Only show in edit mode */}
          {isEditing && (
            <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)' }}>
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
                  setFormData({
                    name: brother.name,
                    pledge_class: brother.pledge_class || '',
                    graduation_year: brother.graduation_year || '',
                    major: brother.major || '',
                    career_aspirations: brother.career_aspirations || '',
                    fun_facts: brother.fun_facts || '',
                    status: brother.status,
                    is_transfer: brother.is_transfer === 1,
                    profile_image_url: brother.profile_image_url || '',
                    linkedin_url: brother.linkedin_url || '',
                    instagram_url: brother.instagram_url || '',
                    personal_website_url: brother.personal_website_url || '',
                    email: brother.email || '',
                  });
                }}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrotherDetailModal;

