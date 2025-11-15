import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { brothers as brothersApi } from '../api';
import { hexToRgba } from '../utils/color';

const linkedinSvg = `
<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" rx="10" fill="#000000"/>
  <circle cx="20" cy="23" r="5" fill="#ffffff"/>
  <rect x="15" y="30" width="10" height="24" fill="#ffffff"/>
  <path d="M33 30h9v4.8C43.2 32.2 45.8 30 49.8 30c5.9 0 10.2 4.2 10.2 11.7V54h-10v-9.8c0-2.6-1.2-4.6-3.8-4.6-2.6 0-4.4 2-4.4 4.7V54H33V30z" fill="#ffffff"/>
</svg>`;
const emailSvg = `
<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" rx="10" fill="#000000"/>
  <rect x="10" y="20" width="44" height="24" rx="4" fill="none" stroke="#ffffff" stroke-width="4"/>
  <path d="M12 22l20 14 20-14" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
const LINKEDIN_ICON_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(linkedinSvg)}`;
const EMAIL_ICON_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(emailSvg)}`;

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

const createInitialFormState = (brother = {}) => ({
  name: brother.name || '',
    pledge_class: brother.pledge_class || '',
    graduation_year: brother.graduation_year || '',
    major: brother.major || '',
    career_aspirations: brother.career_aspirations || '',
    fun_facts: brother.fun_facts || '',
  status: brother.status || 'studying',
    is_transfer: brother.is_transfer === 1,
    profile_image_url: brother.profile_image_url || '',
    linkedin_url: brother.linkedin_url || '',
    instagram_url: brother.instagram_url || '',
    email: brother.email || '',
  bio: brother.bio || '',
});

const BrotherDetailModal = ({
  brother,
  onClose,
  onUpdate,
  theme,
  onToast,
  startInEditMode = false,
  onModeChange,
}) => {

  const [isEditing, setIsEditing] = useState(Boolean(startInEditMode));
  const [formData, setFormData] = useState(createInitialFormState(brother));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setIsEditing(Boolean(startInEditMode));
  }, [startInEditMode, brother.id]);

  useEffect(() => {
    setFormData(createInitialFormState(brother));
  }, [brother]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isEditing) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, isEditing]);

  const enterEditMode = () => {
    setIsEditing(true);
    onModeChange?.('edit');
  };

  const exitEditMode = () => {
    setIsEditing(false);
    onModeChange?.('view');
    setFormData(createInitialFormState(brother));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await brothersApi.update(brother.id, { 
        ...formData, 
        is_transfer: formData.is_transfer ? 1 : 0, 
      });
      setIsEditing(false);
      onModeChange?.('view');
      onUpdate();
      onToast?.({ message: 'Brother updated successfully!', type: 'success' });
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update. Please try again.';
      onToast?.({ message: errorMessage, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

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

  const socialLinks = [
    brother.linkedin_url && {
      id: 'linkedin',
      label: 'LinkedIn',
      href: brother.linkedin_url,
      iconSrc: LINKEDIN_ICON_SRC,
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
  ].filter(Boolean);

  const socialButtonBase = {
    width: '54px',
    height: '54px',
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
        width: '240px',
        height: '240px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: `4px solid ${hexToRgba(theme?.accent || '#ffffff', 0.6)}`,
        boxShadow: '0 18px 36px rgba(0,0,0,0.25)',
      }}
    />
  ) : (
    <div
      style={{
        width: '240px',
        height: '240px',
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

  const bioText = typeof brother.bio === 'string' && brother.bio.trim().length > 0 ? brother.bio.trim() : '';

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

  const infoCardStyle = {
    background: hexToRgba(theme?.background || '#0f1729', 0.28),
    border: `1px solid ${modalColors.cardBorder}`,
    borderRadius: '18px',
    padding: '16px 20px',
    boxShadow: '0 18px 36px rgba(0,0,0,0.08)',
  };

  const emailPillStyle = {
    padding: '12px 16px',
    borderRadius: '16px',
    border: `1px solid ${modalColors.connectBorder}`,
    color: modalColors.text,
    fontWeight: 600,
    textDecoration: 'none',
  };

  const formLabelStyle = {
    fontSize: '11px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: modalColors.label,
    fontWeight: 600,
  };

  const inputStyle = {
    color: '#111',
    backgroundColor: '#ffffff',
    border: '1px solid rgba(0,0,0,0.12)',
    borderRadius: '12px',
    padding: '10px 12px',
    fontSize: '14px',
    width: '100%',
  };

  const textAreaStyle = {
    ...inputStyle,
    minHeight: '90px',
    resize: 'vertical',
  };

  const formFieldStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: 0,
  };

  const formGridStyle = {
    display: 'grid',
    gap: '16px 20px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  };

  const editButtonStyle = {
    borderRadius: '999px',
    border: `1px solid ${hexToRgba(theme?.accent || '#ffffff', 0.4)}`,
    background: hexToRgba(theme?.accent || '#ffffff', 0.12),
    color: modalColors.text,
    fontWeight: 600,
    letterSpacing: '0.08em',
    padding: '12px 18px',
    cursor: 'pointer',
    marginTop: '6px',
  };

  const contactRowStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    alignItems: 'center',
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
        padding: '24px',
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="profile-modal-card glass-panel-elevated rounded-lg shadow-2xl"
        style={{
          background: modalColors.cardBg,
          borderRadius: '24px',
          border: `1px solid ${modalColors.cardBorder}`,
          boxShadow: '0 30px 60px rgba(0,0,0,0.45)',
          color: modalColors.text,
          width: 'min(960px, 94vw)',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '24px 32px 0' }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(0, 0, 0, 0.1)',
              border: 'none',
              color: modalColors.close,
              padding: '6px 10px',
              fontSize: '20px',
              lineHeight: 1,
              borderRadius: '12px',
              cursor: 'pointer',
            }}
            aria-label="Close profile"
          >
            ×
          </button>
        </div>

        <div style={{ padding: '0 32px 36px' }}>
          {!isEditing ? (
            <div
                    style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '32px',
                alignItems: 'flex-start',
              }}
            >
              <div style={{ flex: '0 0 260px', display: 'flex', justifyContent: 'center' }}>{renderAvatar}</div>
              <div style={{ flex: '1 1 360px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div
                    style={{
                      display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                    gap: '16px',
                  }}
                >
                  <div style={{ flex: '1 1 auto', minWidth: 220 }}>
              <h1
                id="modal-title"
                style={{
                  fontSize: '36px',
                  fontFamily: theme?.titleFont || 'var(--font-display)',
                        color: modalColors.text,
                        fontWeight: 700,
                        margin: 0,
                }}
              >
                {brother.name}
              </h1>
                    <p style={{ color: modalColors.secondary, opacity: 0.9, marginTop: 6, marginBottom: 0 }}>
                      {brother.major || brother.pledge_class || 'Nu Chapter Brother'}
                    </p>
                    {bioText && (
                      <p style={{ color: modalColors.secondary, marginTop: 6, marginBottom: 0, lineHeight: 1.5 }}>
                        {bioText}
                      </p>
                    )}
                  </div>
                  <button type="button" onClick={enterEditMode} style={editButtonStyle}>
                    Edit Profile
                  </button>
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
                        textTransform: 'uppercaserceSpacing',
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

                {(socialLinks.length > 0 || brother.email) && (
                  <div>
                    <div style={cardHeadingStyle}>Contact</div>
                    <div style={contactRowStyle}>
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
                          {link.iconSrc ? (
                            <img src={link.iconSrc} alt={`${link.label} icon`} style={{ width: 20, height: 20 }} />
                          ) : (
                            link.icon
                          )}
                        </a>
                      ))}
                    {brother.email && (
                        <a href={`mailto:${brother.email}`} style={emailPillStyle}>
                          {brother.email}
                      </a>
                    )}
                  </div>
                </div>
              )}

                {brother.fun_facts && (
                  <div style={{ ...infoCardStyle, padding: '16px 18px' }}>
                    <div style={cardHeadingStyle}>About</div>
                    <p style={cardBodyStyle}>{brother.fun_facts}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={formGridStyle}>
                <div style={formFieldStyle}>
                  <label style={formLabelStyle}>Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={inputStyle}
                  />
          </div>
                <div style={formFieldStyle}>
                  <label style={formLabelStyle}>Pledge Class</label>
              <input
                type="text"
                value={formData.pledge_class}
                onChange={(e) => setFormData({ ...formData, pledge_class: e.target.value })}
                    style={inputStyle}
                  />
          </div>
                <div style={formFieldStyle}>
                  <label style={formLabelStyle}>Graduation Year</label>
              <input
                type="number"
                value={formData.graduation_year}
                    onChange={(e) =>
                      setFormData({ ...formData, graduation_year: e.target.value ? parseInt(e.target.value, 10) : '' })
                    }
                    style={inputStyle}
                  />
          </div>
                <div style={formFieldStyle}>
                  <label style={formLabelStyle}>Major</label>
              <input
                type="text"
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={formFieldStyle}>
                  <label style={formLabelStyle}>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="studying">Currently Studying</option>
                    <option value="graduated">Graduated</option>
                  </select>
                </div>
          </div>

              <div style={{ ...formGridStyle, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                <div style={{ ...formFieldStyle, gridColumn: '1 / -1' }}>
                  <label style={formLabelStyle}>Bio (optional)</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    style={textAreaStyle}
                  />
                </div>
                <div style={{ ...formFieldStyle, gridColumn: '1 / -1' }}>
                  <label style={formLabelStyle}>Career Aspirations (optional)</label>
              <textarea
                value={formData.career_aspirations}
                onChange={(e) => setFormData({ ...formData, career_aspirations: e.target.value })}
                    style={textAreaStyle}
                  />
          </div>
                <div style={{ ...formFieldStyle, gridColumn: '1 / -1' }}>
                  <label style={formLabelStyle}>About / Fun Facts</label>
              <textarea
                value={formData.fun_facts}
                onChange={(e) => setFormData({ ...formData, fun_facts: e.target.value })}
                    style={textAreaStyle}
                  />
          </div>
          </div>

              <div style={formGridStyle}>
                <div style={formFieldStyle}>
                  <label style={formLabelStyle}>Profile Image URL</label>
                <input
                  type="text"
                  value={formData.profile_image_url}
                  onChange={(e) => setFormData({ ...formData, profile_image_url: e.target.value })}
                    style={inputStyle}
                  />
              </div>
                <div style={formFieldStyle}>
                  <label style={formLabelStyle}>LinkedIn URL</label>
                    <input
                      type="url"
                      value={formData.linkedin_url}
                      onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                    style={inputStyle}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                <div style={formFieldStyle}>
                  <label style={formLabelStyle}>Instagram URL</label>
                    <input
                      type="url"
                      value={formData.instagram_url}
                      onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                    style={inputStyle}
                      placeholder="https://instagram.com/username"
                    />
                  </div>
                <div style={formFieldStyle}>
                  <label style={formLabelStyle}>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={inputStyle}
                  />
                </div>
          </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.is_transfer}
                  onChange={(e) => setFormData({ ...formData, is_transfer: e.target.checked })}
                />
                <span style={{ color: theme?.nodeText || modalColors.text, fontSize: '14px' }}>Transfer Brother</span>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
              <button
                onClick={handleSave}
                disabled={saving}
                  className="btn btn-primary"
                  style={{ flex: '1 1 200px', minWidth: '180px' }}
              >
                  {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                  type="button"
                  onClick={exitEditMode}
                  className="btn btn-secondary"
                  style={{ flex: '0 0 auto', minWidth: '180px' }}
              >
                Cancel
              </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default BrotherDetailModal;
