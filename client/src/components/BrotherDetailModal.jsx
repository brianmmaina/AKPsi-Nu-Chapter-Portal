import { useState, useEffect, useMemo } from 'react';
import { brothers as brothersApi } from '../api';
import { hexToRgba } from '../utils/color';

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
const BrotherDetailModal = ({ brother, onClose, onUpdate, theme, onToast }) => {
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

  const palette = useMemo(() => {
    const base = {
      heading: theme?.nodeText || '#1f1f1f',
      bodyText: theme?.nodeText || '#1f1f1f',
      label: 'rgba(31, 31, 31, 0.72)',
      panelBg: theme?.background || '#f8f7f3',
      accentPanel: hexToRgba(theme?.accent || '#c9a857', 0.12),
      fieldBorder: theme?.nodeBorder || '#d4c9b3',
      buttonBg: theme?.accent || '#c9a857',
      connectBg: theme?.background || '#f8f7f3',
      connectBorder: hexToRgba(theme?.accent || '#c9a857', 0.7),
      linkGlow: '0 6px 16px rgba(0,0,0,0.25)',
    };

    const accent = (theme?.accent || '').toLowerCase();
    const background = (theme?.background || '').toLowerCase();

    if (accent === '#ebd290') {
      return {
        ...base,
        heading: '#fef3d8',
        bodyText: 'rgba(249, 238, 205, 0.94)',
        label: 'rgba(247, 235, 206, 0.85)',
        panelBg: 'linear-gradient(135deg, rgba(18,30,46,0.92) 0%, rgba(10,22,38,0.88) 100%)',
        accentPanel: 'rgba(243,220,166,0.18)',
        fieldBorder: 'rgba(50,74,110,0.82)',
        connectBg: 'rgba(17, 30, 48, 0.92)',
        connectBorder: 'rgba(243,220,166,0.58)',
        linkGlow: '0 6px 18px rgba(8,16,24,0.45)',
      };
    }

    if (accent === '#f4d961') {
      return {
        ...base,
        heading: '#0b2517',
        bodyText: '#123220',
        label: 'rgba(10, 35, 23, 0.72)',
        panelBg: 'linear-gradient(135deg, rgba(246,252,244,0.95) 0%, rgba(236,248,233,0.9) 100%)',
        accentPanel: 'rgba(244,217,97,0.2)',
        fieldBorder: 'rgba(182,215,138,0.82)',
        connectBg: 'rgba(241,250,233,0.95)',
        connectBorder: 'rgba(244,217,97,0.62)',
        linkGlow: '0 6px 16px rgba(12,35,23,0.22)',
      };
    }

    if (accent === '#ffffff' && background.includes('#364c73')) {
      return {
        ...base,
        heading: '#f0f5ff',
        bodyText: 'rgba(214,223,240,0.88)',
        label: 'rgba(200,212,235,0.75)',
        panelBg: 'linear-gradient(135deg, rgba(33,45,69,0.9) 0%, rgba(24,34,54,0.88) 100%)',
        accentPanel: 'rgba(156,184,234,0.18)',
        fieldBorder: 'rgba(118,144,198,0.8)',
        connectBg: 'rgba(34,47,71,0.9)',
        connectBorder: 'rgba(156,184,234,0.6)',
        linkGlow: '0 6px 16px rgba(26,37,58,0.32)',
      };
    }

    if (accent === '#d4af7e') {
      return {
        ...base,
        heading: '#f9e8c8',
        bodyText: 'rgba(248, 236, 220, 0.9)',
        label: 'rgba(245, 225, 205, 0.7)',
        panelBg: 'linear-gradient(135deg, rgba(34,24,16,0.92) 0%, rgba(26,18,12,0.9) 100%)',
        accentPanel: 'rgba(212,175,126,0.2)',
        fieldBorder: 'rgba(196,155,101,0.82)',
        connectBg: 'rgba(32,22,15,0.88)',
        connectBorder: 'rgba(212,175,126,0.6)',
        linkGlow: '0 6px 18px rgba(0,0,0,0.35)',
      };
    }

    return base;
  }, [theme]);

  if (!brother) return null;

  const handleBackdropClick = (e) => {
    // Only close if clicking the backdrop itself, not the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100, // Above header (z-index 21) - modal overlay
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        pointerEvents: 'auto',
      }}
      onClick={handleBackdropClick}
      onMouseDown={(e) => {
        // Prevent ReactFlow from capturing the mousedown event
        e.stopPropagation();
      }}
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
                  background: palette.panelBg,
                  border: `1px solid ${palette.fieldBorder}`,
                  borderRadius: '0px',
                }}>
                  <p style={{ 
                    color: palette.bodyText, 
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
                  background: palette.panelBg,
                  border: `2px solid ${palette.connectBorder}`,
                  borderRadius: '0px',
                }}>
                  <h3 style={{ 
                    fontSize: '12px', 
                    fontWeight: '700', 
                    color: palette.heading,
                    marginBottom: 'var(--space-3)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}>
                    Career Aspirations
                  </h3>
                  <p style={{ 
                    color: palette.bodyText, 
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
                  background: palette.panelBg,
                  border: `2px solid ${palette.connectBorder}`,
                  borderRadius: '0px',
                }}>
                  <h3 style={{ 
                    fontSize: '12px', 
                    fontWeight: '700', 
                    color: palette.heading,
                    marginBottom: 'var(--space-3)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}>
                    About
                  </h3>
                  <p style={{ 
                    color: palette.bodyText, 
                    lineHeight: '1.7',
                    fontSize: '15px',
                    margin: 0,
                  }}>
                    {brother.fun_facts}
                  </p>
                </div>
              )}

              {/* Links Section */}
              {(brother.linkedin_url || brother.instagram_url || brother.email) && (
                <div style={{ 
                  marginBottom: 'var(--space-6)',
                  padding: '16px 20px',
                  background: palette.connectBg,
                  border: `2px solid ${palette.connectBorder}`,
                  borderRadius: '0px',
                }}>
                  <h3 style={{ 
                    fontSize: '12px', 
                    fontWeight: '700', 
                    color: palette.heading,
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}>
                    Connect
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
                    {brother.linkedin_url && (
                      <a
                        href={brother.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '48px',
                          height: '48px',
                          backgroundColor: '#0077b5',
                          color: 'white',
                          borderRadius: '0px',
                          textDecoration: 'none',
                          transition: 'transform 0.2s, box-shadow 0.2s, filter 0.2s',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = palette.linkGlow;
                          e.currentTarget.style.filter = 'brightness(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.filter = 'brightness(1)';
                        }}
                        title="LinkedIn"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
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
                          justifyContent: 'center',
                          width: '48px',
                          height: '48px',
                          background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
                          color: 'white',
                          borderRadius: '0px',
                          textDecoration: 'none',
                          transition: 'transform 0.2s, box-shadow 0.2s, filter 0.2s',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = palette.linkGlow;
                          e.currentTarget.style.filter = 'brightness(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.filter = 'brightness(1)';
                        }}
                        title="Instagram"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </a>
                    )}
                    {brother.email && (
                      <a
                        href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(brother.email)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '48px',
                          height: '48px',
                          backgroundColor: '#ea4335',
                          color: 'white',
                          borderRadius: '0px',
                          textDecoration: 'none',
                          transition: 'transform 0.2s, box-shadow 0.2s, filter 0.2s',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = palette.linkGlow;
                          e.currentTarget.style.filter = 'brightness(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.filter = 'brightness(1)';
                        }}
                        title={`Email: ${brother.email}`}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                        </svg>
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
            <label className="label" style={{ color: '#1f1f1f', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
              Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                style={{ 
                  color: '#1f1f1f',
                  backgroundColor: '#ffffff',
                  border: '2px solid #d4c9b3',
                  borderRadius: '0px',
                  padding: '10px 12px',
                }}
              />
            ) : (
              <p style={{ color: theme?.nodeText || 'var(--text)', fontWeight: 'var(--weight-semibold)' }}>{brother.name}</p>
            )}
          </div>

          <div>
            <label className="label" style={{ color: '#1f1f1f', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
              Pledge Class
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.pledge_class}
                onChange={(e) => setFormData({ ...formData, pledge_class: e.target.value })}
                className="input"
                style={{ 
                  color: '#1f1f1f',
                  backgroundColor: '#ffffff',
                  border: '2px solid #d4c9b3',
                  borderRadius: '0px',
                  padding: '10px 12px',
                }}
              />
            ) : (
              <p style={{ color: theme?.nodeText || 'var(--text-muted)' }}>{brother.pledge_class || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="label" style={{ color: '#1f1f1f', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
              Graduation Year (Class of)
            </label>
            {isEditing ? (
              <input
                type="number"
                value={formData.graduation_year}
                onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value ? parseInt(e.target.value) : '' })}
                className="input"
                style={{ 
                  color: '#1f1f1f',
                  backgroundColor: '#ffffff',
                  border: '2px solid #d4c9b3',
                  borderRadius: '0px',
                  padding: '10px 12px',
                }}
              />
            ) : (
              <p style={{ color: theme?.nodeText || 'var(--text-muted)' }}>{brother.graduation_year ? `Class of ${brother.graduation_year}` : 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="label" style={{ color: '#1f1f1f', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
              Major
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                className="input"
                style={{ 
                  color: '#1f1f1f',
                  backgroundColor: '#ffffff',
                  border: '2px solid #d4c9b3',
                  borderRadius: '0px',
                  padding: '10px 12px',
                }}
              />
            ) : (
              <p style={{ color: theme?.nodeText || 'var(--text-muted)' }}>{brother.major || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="label" style={{ color: '#1f1f1f', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
              Career Aspirations
            </label>
            {isEditing ? (
              <textarea
                value={formData.career_aspirations}
                onChange={(e) => setFormData({ ...formData, career_aspirations: e.target.value })}
                className="input"
                style={{ 
                  color: '#1f1f1f',
                  backgroundColor: '#ffffff',
                  border: '2px solid #d4c9b3',
                  borderRadius: '0px',
                  padding: '10px 12px',
                  minHeight: '80px', 
                  resize: 'vertical' 
                }}
                rows="3"
              />
            ) : (
              <p style={{ color: theme?.nodeText || 'var(--text-muted)' }}>{brother.career_aspirations || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="label" style={{ color: '#1f1f1f', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
              Fun Facts
            </label>
            {isEditing ? (
              <textarea
                value={formData.fun_facts}
                onChange={(e) => setFormData({ ...formData, fun_facts: e.target.value })}
                className="input"
                style={{ 
                  color: '#1f1f1f',
                  backgroundColor: '#ffffff',
                  border: '2px solid #d4c9b3',
                  borderRadius: '0px',
                  padding: '10px 12px',
                  minHeight: '80px', 
                  resize: 'vertical' 
                }}
                rows="3"
              />
            ) : (
              <p style={{ color: theme?.nodeText || 'var(--text-muted)' }}>{brother.fun_facts || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="label" style={{ color: '#1f1f1f', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
              Status
            </label>
            {isEditing ? (
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input"
                style={{ 
                  color: '#1f1f1f',
                  backgroundColor: '#ffffff',
                  border: '2px solid #d4c9b3',
                  borderRadius: '0px',
                  padding: '10px 12px',
                }}
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
                    backgroundColor: brother.status === 'studying'
                      ? (theme?.accent || 'var(--success)')
                      : hexToRgba(palette.heading, 0.25),
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
                <label className="label" style={{ color: '#1f1f1f', fontWeight: '600', fontSize: 'var(--text-base)', marginBottom: '8px', display: 'block' }}>
                  Profile Image URL
                </label>
                <input
                  type="text"
                  value={formData.profile_image_url}
                  onChange={(e) => setFormData({ ...formData, profile_image_url: e.target.value })}
                  className="input"
                  placeholder="https://example.com/image.jpg"
                  style={{ 
                    color: '#1f1f1f',
                    backgroundColor: '#ffffff',
                    border: '2px solid #d4c9b3',
                    borderRadius: '0px',
                    padding: '10px 12px',
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
                  Links
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div>
                    <label className="label" style={{ color: '#1f1f1f', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={formData.linkedin_url}
                      onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                      className="input"
                      placeholder="https://linkedin.com/in/username"
                      style={{ 
                        color: '#1f1f1f',
                        backgroundColor: '#ffffff',
                        border: '2px solid #d4c9b3',
                        borderRadius: '0px',
                        padding: '10px 12px',
                      }}
                    />
                  </div>

                  <div>
                    <label className="label" style={{ color: '#1f1f1f', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                      Instagram URL
                    </label>
                    <input
                      type="url"
                      value={formData.instagram_url}
                      onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                      className="input"
                      placeholder="https://instagram.com/username"
                      style={{ 
                        color: '#1f1f1f',
                        backgroundColor: '#ffffff',
                        border: '2px solid #d4c9b3',
                        borderRadius: '0px',
                        padding: '10px 12px',
                      }}
                    />
                  </div>

                  <div>
                    <label className="label" style={{ color: '#1f1f1f', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input"
                      placeholder="example@email.com"
                      style={{ 
                        color: '#1f1f1f',
                        backgroundColor: '#ffffff',
                        border: '2px solid #d4c9b3',
                        borderRadius: '0px',
                        padding: '10px 12px',
                      }}
                    />
                  </div>
                </div>
          </div>

          {isEditing && (
            <div>
                  <label className="label" style={{ color: '#1f1f1f', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
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

