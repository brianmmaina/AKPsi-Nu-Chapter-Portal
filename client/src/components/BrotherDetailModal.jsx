import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { brothers as brothersApi } from '../api';
import { hexToRgba } from '../utils/color';

const isHexDark = (color) => {
  if (!color || typeof color !== 'string') {
    return false;
  }
  const cleaned = color.replace('#', '');
  if (![3, 6].includes(cleaned.length)) {
    return false;
  }
  const hex = cleaned.length === 3 ? cleaned.split('').map((c) => c + c).join('') : cleaned;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance < 140;
};

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

  const modalColors = useMemo(
    () => ({
      overlay: theme?.modalBg || 'rgba(0, 0, 0, 0.7)',
      text: theme?.modalText || theme?.modalTextColor || palette.heading,
      secondary: theme?.modalSecondaryText || palette.bodyText,
      label: theme?.modalLabelText || palette.label,
      cardBg: theme?.modalCardBg || palette.panelBg,
      cardBorder: theme?.modalCardBorder || palette.fieldBorder,
      close: theme?.modalCloseColor || palette.heading,
      connectBg: theme?.connectButtonBg || palette.connectBg,
      connectBorder: theme?.connectButtonBorder || palette.connectBorder,
      connectIcon: theme?.connectButtonIcon || palette.heading,
    }),
    [theme, palette],
  );

  const isDarkTheme = useMemo(() => isHexDark(theme?.background), [theme]);

  if (!brother) return null;

  const infoCardStyle = {
    background: modalColors.cardBg,
    border: `1px solid ${modalColors.cardBorder}`,
    borderRadius: '18px',
    padding: '18px 22px',
    boxShadow: '0 18px 36px rgba(0,0,0,0.08)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    color: modalColors.text,
  };

  const socialLinks = [
    brother.linkedin_url && {
      id: 'linkedin',
      label: 'LinkedIn',
      href: brother.linkedin_url,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4.98 3.5a2.5 2.5 0 1 1-.01 5.001 2.5 2.5 0 0 1 .01-5zm-.02 7.5h5v9h-5v-9zm7 0h4.78v1.31h.07c.66-1.14 2.27-2.35 4.68-2.35 5 0 5.93 3.01 5.93 6.93v6.11h-5v-5.41c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.85v5.51h-4.58v-11z" />
        </svg>
      ),
    },
    brother.instagram_url && {
      id: 'instagram',
      label: 'Instagram',
      href: brother.instagram_url,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <path d="M16 11.37a4 4 0 1 1-7.999.001A4 4 0 0 1 16 11.37z" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    brother.email && {
      id: 'email',
      label: 'Email',
      href: `mailto:${brother.email}`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="M3 7.5 12 13l9-5.5" />
        </svg>
      ),
    },
  ].filter(Boolean);

  const socialButtonBase = {
    width: '52px',
    height: '52px',
    borderRadius: '16px',
    border: `1px solid ${modalColors.connectBorder}`,
    background: modalColors.connectBg,
    color: modalColors.connectIcon || (isDarkTheme ? '#ffffff' : '#111111'),
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    textDecoration: 'none',
  };

  const renderAvatar = brother.profile_image_url ? (
    <img
      src={brother.profile_image_url}
      alt={brother.name}
      style={{
        width: '220px',
        height: '220px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: `4px solid ${hexToRgba(theme?.accent || '#ffffff', 0.6)}`,
        boxShadow: '0 18px 36px rgba(0,0,0,0.25)',
      }}
    />
  ) : (
    <div
      style={{
        width: '220px',
        height: '220px',
        borderRadius: '50%',
        background: hexToRgba(theme?.accent || '#c9a857', 0.9),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isDarkTheme ? '#111' : '#fdf7ec',
        fontSize: '56px',
        fontWeight: 700,
        border: `4px solid ${hexToRgba(theme?.accent || '#c9a857', 0.6)}`,
        boxShadow: '0 18px 36px rgba(0,0,0,0.25)',
      }}
    >
      {brother.name.charAt(0).toUpperCase()}
    </div>
  );

  const cardHeadingStyle = {
    fontSize: '11px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: modalColors.label,
    marginBottom: '8px',
    opacity: 0.9,
  };

  const cardBodyStyle = {
    color: modalColors.text,
    fontSize: '14px',
    lineHeight: 1.6,
    margin: 0,
  };

  const handleBackdropClick = (e) => {
    // Only close if clicking the backdrop itself, not the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modal = (
    <div
      className="profile-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        backgroundColor: modalColors.overlay,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        pointerEvents: 'auto',
        padding: '24px',
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
        className="profile-modal-card glass-panel-elevated rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        style={{
          background: modalColors.cardBg,
          borderRadius: '24px',
          border: `1px solid ${modalColors.cardBorder}`,
          boxShadow: '0 30px 60px rgba(0,0,0,0.45)',
          color: modalColors.text,
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
              color: modalColors.close,
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
          <>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '32px',
                justifyContent: 'center',
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  flex: '0 0 240px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '18px',
                }}
              >
                {renderAvatar}
                {socialLinks.length > 0 && (
                  <div style={{ ...infoCardStyle, width: '100%', textAlign: 'center', padding: '16px' }}>
                    <div style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: modalColors.label, opacity: 0.9, marginBottom: '10px' }}>
                      Connect
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
                      {socialLinks.map((link) => (
                        <a
                          key={link.id}
                          href={link.href}
                          target={link.href.startsWith('http') ? '_blank' : undefined}
                          rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                          style={socialButtonBase}
                          onMouseEnter={(event) => {
                            event.currentTarget.style.transform = 'translateY(-2px)';
                            event.currentTarget.style.boxShadow = '0 10px 18px rgba(0,0,0,0.25)';
                          }}
                          onMouseLeave={(event) => {
                            event.currentTarget.style.transform = 'translateY(0)';
                            event.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          {link.icon}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {brother.email && (
                  <div style={{ ...infoCardStyle, width: '100%', textAlign: 'center', padding: '14px 18px' }}>
                    <div style={{ fontSize: '11px', letterSpacing: '0.08em', opacity: 0.9, textTransform: 'uppercase', color: modalColors.label }}>
                      Email
                    </div>
                    <div style={{ fontWeight: 600 }}>{brother.email}</div>
                  </div>
                )}
              </div>

              <div style={{ flex: '1 1 360px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <h1
                    id="modal-title"
                    style={{
                      fontSize: '34px',
                      fontFamily: theme?.titleFont || 'var(--font-display)',
                      color: modalColors.text,
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    {brother.name}
                  </h1>
                  <p style={{ color: modalColors.secondary, opacity: 0.85, marginTop: '4px', marginBottom: 0 }}>
                    {brother.major || brother.pledge_class || 'Nu Chapter Brother'}
                  </p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {brother.pledge_class && (
                    <span
                      style={{
                        padding: '6px 14px',
                        borderRadius: '999px',
                        border: `1px solid ${hexToRgba(theme?.accent || '#c9a857', 0.4)}`,
                        background: hexToRgba(theme?.accent || '#c9a857', 0.12),
                        fontSize: '11px',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: modalColors.label,
                      }}
                    >
                      {brother.pledge_class}
                    </span>
                  )}
                  {brother.graduation_year && (
                    <span
                      style={{
                        padding: '6px 14px',
                        borderRadius: '999px',
                        border: `1px solid ${hexToRgba(theme?.accent || '#c9a857', 0.35)}`,
                        background: hexToRgba(theme?.accent || '#c9a857', 0.08),
                        fontSize: '11px',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: modalColors.label,
                      }}
                    >
                      Class of {brother.graduation_year}
                    </span>
                  )}
                  <span
                    style={{
                      padding: '6px 14px',
                      borderRadius: '999px',
                      border: `1px solid ${hexToRgba(theme?.accent || '#c9a857', 0.35)}`,
                      background: hexToRgba(theme?.accent || '#c9a857', 0.08),
                      fontSize: '11px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: modalColors.label,
                    }}
                  >
                    {brother.status === 'studying' ? 'Active Brother' : 'Alumni'}
                  </span>
                </div>

                {brother.major && (
                  <div style={infoCardStyle}>
                    <div style={cardHeadingStyle}>Major</div>
                    <p style={cardBodyStyle}>{brother.major}</p>
                  </div>
                )}

                {brother.career_aspirations && (
                  <div style={infoCardStyle}>
                    <div style={cardHeadingStyle}>Career Aspirations</div>
                    <p style={cardBodyStyle}>{brother.career_aspirations}</p>
                  </div>
                )}

                {brother.fun_facts && (
                  <div style={infoCardStyle}>
                    <div style={cardHeadingStyle}>About</div>
                    <p style={cardBodyStyle}>{brother.fun_facts}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
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

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(modal, document.body);
};

export default BrotherDetailModal;

