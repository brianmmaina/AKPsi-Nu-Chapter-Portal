import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { brothers as brothersApi } from '../api';
import { hexToRgba } from '../utils/color';
import { getSupabaseClient } from '../services/supabaseClient';

const isHexDark = (color) => {
  if (!color || typeof color !== 'string') return false;
  const cleaned = color.replace('#', '');
  if (![3, 6].includes(cleaned.length)) return false;
  const hex = cleaned.length === 3 ? cleaned.split('').map((c) => c + c).join('') : cleaned;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
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

const PHOTO_BUCKET = 'profile-photos';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

const BrotherDetailModal = ({
  brother,
  onClose,
  onUpdate,
  theme,
  onToast,
  startInEditMode = false,
  onModeChange,
  onViewPoints,
}) => {
  const [isEditing, setIsEditing] = useState(Boolean(startInEditMode));
  const [formData, setFormData] = useState(createInitialFormState(brother));
  const [saving, setSaving] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 600);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 600px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => { setIsEditing(Boolean(startInEditMode)); }, [startInEditMode, brother.id]);
  useEffect(() => { setFormData(createInitialFormState(brother)); }, [brother]);
  useEffect(() => { setPhotoFailed(false); }, [brother.profile_image_url]);

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape' && !isEditing) onClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, isEditing]);

  // Cleanup object URL on unmount or when photo changes
  useEffect(() => {
    return () => { if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl); };
  }, [photoPreviewUrl]);

  const enterEditMode = () => { setIsEditing(true); onModeChange?.('edit'); };
  const exitEditMode = () => {
    setIsEditing(false);
    onModeChange?.('view');
    setFormData(createInitialFormState(brother));
    setPhotoFile(null);
    setPhotoPreviewUrl('');
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      onToast?.({ message: 'Please select a JPG, PNG, or WebP image.', type: 'error' });
      return;
    }
    if (file.size > MAX_BYTES) {
      onToast?.({ message: 'Image must be under 5 MB.', type: 'error' });
      return;
    }
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  };

  const uploadPhoto = async () => {
    if (!photoFile) return formData.profile_image_url;
    const supabase = getSupabaseClient();
    if (!supabase) return formData.profile_image_url;
    setPhotoUploading(true);
    try {
      const ext = photoFile.name.split('.').pop();
      const path = `brothers/${brother.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, photoFile, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
      return data.publicUrl;
    } catch {
      onToast?.({ message: 'Photo upload failed — profile saved without new image.', type: 'error' });
      return formData.profile_image_url;
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const uploadedUrl = await uploadPhoto();
      await brothersApi.update(brother.id, {
        ...formData,
        profile_image_url: uploadedUrl,
        is_transfer: formData.is_transfer ? 1 : 0,
      });
      setIsEditing(false);
      onModeChange?.('view');
      onUpdate();
      onToast?.({ message: 'Profile updated successfully!', type: 'success' });
    } catch (error) {
      const msg = error.response?.data?.error || error.message || 'Failed to update. Please try again.';
      onToast?.({ message: msg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const palette = useMemo(() => {
    const base = {
      heading: theme?.nodeText || '#1f1f1f',
      bodyText: theme?.nodeText || '#1f1f1f',
      label: 'rgba(31,31,31,0.72)',
      panelBg: theme?.background || '#f8f7f3',
      accentPanel: hexToRgba(theme?.accent || '#c9a857', 0.12),
      fieldBorder: theme?.nodeBorder || '#d4c9b3',
      buttonBg: theme?.accent || '#c9a857',
      connectBg: theme?.background || '#f8f7f3',
      connectBorder: hexToRgba(theme?.accent || '#c9a857', 0.7),
    };
    const accent = (theme?.accent || '').toLowerCase();
    const background = (theme?.background || '').toLowerCase();

    if (accent === '#ebd290') return {
      ...base,
      heading: '#fef3d8', bodyText: 'rgba(249,238,205,0.94)', label: 'rgba(247,235,206,0.85)',
      panelBg: 'linear-gradient(145deg,rgba(11,27,46,0.98),rgba(6,19,34,0.98))',
      accentPanel: 'rgba(243,220,166,0.14)', fieldBorder: 'rgba(50,74,110,0.82)',
      connectBg: 'rgba(17,30,48,0.92)', connectBorder: 'rgba(243,220,166,0.52)',
    };
    if (accent === '#f4d961') return {
      ...base,
      heading: '#0b2517', bodyText: '#123220', label: 'rgba(10,35,23,0.72)',
      panelBg: 'linear-gradient(145deg,rgba(246,252,244,0.95),rgba(236,248,233,0.9))',
      accentPanel: 'rgba(244,217,97,0.2)', fieldBorder: 'rgba(182,215,138,0.82)',
      connectBg: 'rgba(241,250,233,0.95)', connectBorder: 'rgba(244,217,97,0.62)',
    };
    if (accent === '#ffffff' && background.includes('#364c73')) return {
      ...base,
      heading: '#f0f5ff', bodyText: 'rgba(214,223,240,0.88)', label: 'rgba(200,212,235,0.75)',
      panelBg: 'linear-gradient(145deg,rgba(33,45,69,0.9),rgba(24,34,54,0.88))',
      accentPanel: 'rgba(156,184,234,0.18)', fieldBorder: 'rgba(118,144,198,0.8)',
      connectBg: 'rgba(34,47,71,0.9)', connectBorder: 'rgba(156,184,234,0.6)',
    };
    if (accent === '#d4af7e') return {
      ...base,
      heading: '#f9e8c8', bodyText: 'rgba(248,236,220,0.9)', label: 'rgba(245,225,205,0.7)',
      panelBg: 'linear-gradient(145deg,rgba(34,24,16,0.92),rgba(26,18,12,0.9))',
      accentPanel: 'rgba(212,175,126,0.2)', fieldBorder: 'rgba(196,155,101,0.82)',
      connectBg: 'rgba(32,22,15,0.88)', connectBorder: 'rgba(212,175,126,0.6)',
    };
    return base;
  }, [theme]);

  const mc = useMemo(() => ({
    overlay: theme?.modalBg || 'rgba(0,0,0,0.72)',
    text: theme?.modalText || theme?.modalTextColor || palette.heading,
    secondary: theme?.modalSecondaryText || palette.bodyText,
    label: theme?.modalLabelText || palette.label,
    cardBg: theme?.modalCardBg || palette.panelBg,
    cardBorder: theme?.modalCardBorder || palette.fieldBorder,
    close: theme?.modalCloseColor || palette.heading,
    connectBg: theme?.connectButtonBg || palette.connectBg,
    connectBorder: theme?.connectButtonBorder || palette.connectBorder,
    accent: theme?.accent || '#c9a857',
  }), [theme, palette]);

  const isDark = useMemo(() => isHexDark(theme?.background), [theme]);

  // Initials (up to 2 letters)
  const initials = (brother.name || '')
    .split(' ').filter(Boolean).slice(0, 2)
    .map(w => w[0].toUpperCase()).join('');

  // Which photo URL to display (preview during edit, saved otherwise)
  const viewPhotoUrl = brother.profile_image_url;
  const editPhotoUrl = photoPreviewUrl || formData.profile_image_url;
  const activePhotoUrl = isEditing ? editPhotoUrl : viewPhotoUrl;
  const showPhoto = Boolean(activePhotoUrl) && !photoFailed;

  // ── Shared style atoms ────────────────────────────────────────────────────
  const accentColor = mc.accent;
  const chipStyle = {
    padding: '4px 10px',
    borderRadius: '5px',
    border: `1px solid ${hexToRgba(accentColor, 0.35)}`,
    background: hexToRgba(accentColor, 0.1),
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.09em',
    textTransform: 'uppercase',
    color: mc.label,
  };

  const actionBase = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '40px',
    padding: '0 18px',
    borderRadius: '7px',
    fontSize: '0.72rem',
    fontWeight: 800,
    letterSpacing: '0.11em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    border: 'none',
    fontFamily: 'inherit',
  };

  const primaryAction = {
    ...actionBase,
    background: '#d8b54a',
    border: '1px solid rgba(228,200,113,0.78)',
    color: '#142033',
  };

  const secondaryAction = {
    ...actionBase,
    background: 'transparent',
    border: `1px solid ${hexToRgba(accentColor, 0.45)}`,
    color: mc.text,
  };

  const formLabelStyle = {
    fontSize: '11px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: mc.label,
    fontWeight: 700,
  };

  const inputStyle = {
    color: '#111',
    backgroundColor: '#ffffff',
    border: '1px solid rgba(0,0,0,0.14)',
    borderRadius: '7px',
    padding: '9px 12px',
    fontSize: '14px',
    width: '100%',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  const textAreaStyle = { ...inputStyle, minHeight: '86px', resize: 'vertical' };
  const fieldStyle = { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 };
  const formGridStyle = { display: 'grid', gap: '14px 18px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' };

  const sectionLabel = {
    fontSize: '10px',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: mc.label,
    fontWeight: 800,
    marginBottom: '8px',
    opacity: 0.85,
  };

  // ── Avatar ────────────────────────────────────────────────────────────────
  const avatarSize = isMobile ? 150 : 210;
  const avatarStyle = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: '50%',
    overflow: 'hidden',
    border: `3px solid ${hexToRgba(accentColor, 0.72)}`,
    background: hexToRgba(accentColor, 0.12),
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    boxShadow: '0 12px 28px rgba(0,0,0,0.28)',
  };

  const Avatar = (
    <div style={avatarStyle}>
      {showPhoto ? (
        <img
          src={activePhotoUrl}
          alt=""
          style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
          onError={() => setPhotoFailed(true)}
        />
      ) : (
        <span style={{
          fontSize: '3rem',
          fontWeight: 700,
          color: hexToRgba(accentColor === '#ffffff' ? (isDark ? '#ffffff' : '#111111') : accentColor, 0.92),
          letterSpacing: '0.06em',
          userSelect: 'none',
        }}>
          {initials}
        </span>
      )}
    </div>
  );

  // ── Bio text ──────────────────────────────────────────────────────────────
  const bioText = typeof brother.bio === 'string' ? brother.bio.trim() : '';
  const funFacts = typeof brother.fun_facts === 'string' ? brother.fun_facts.trim() : '';

  const modal = (
    <div
      className="profile-modal-overlay"
      style={{
        position: 'fixed', inset: 0, width: '100vw', height: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, backgroundColor: mc.overlay,
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        padding: '20px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        style={{
          background: mc.cardBg,
          borderRadius: '12px',
          border: `1px solid ${mc.cardBorder}`,
          boxShadow: '0 24px 58px rgba(0,0,0,0.46), inset 0 1px 0 rgba(255,255,255,0.04)',
          color: mc.text,
          width: 'min(980px, calc(100vw - 40px))',
          maxHeight: '92vh',
          overflowY: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            width: '38px', height: '38px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.06)',
            border: `1px solid ${hexToRgba(accentColor, 0.22)}`,
            borderRadius: '7px',
            color: mc.close, fontSize: '18px', lineHeight: 1,
            cursor: 'pointer', flexShrink: 0, zIndex: 2,
          }}
          aria-label="Close profile"
        >
          ×
        </button>

        <div style={{ padding: '34px' }}>
          {!isEditing ? (
            /* ── VIEW MODE ── */
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : `${avatarSize}px minmax(0, 1fr)`,
              gap: isMobile ? '24px' : '36px',
              alignItems: 'center',
            }}>
              {/* Left: avatar */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'center' : 'flex-start', gap: '14px' }}>
                {Avatar}
              </div>

              {/* Right: details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', minWidth: 0 }}>
                {/* Name + major */}
                <div>
                  <h1
                    id="modal-title"
                    style={{
                      fontSize: 'clamp(22px, 3vw, 32px)',
                      fontFamily: theme?.titleFont || 'var(--font-display)',
                      color: mc.text, fontWeight: 700, margin: '0 0 4px',
                      lineHeight: 1.1, paddingRight: '48px',
                    }}
                  >
                    {brother.name}
                  </h1>
                  {brother.major && (
                    <p style={{ color: mc.secondary, margin: 0, fontSize: '15px', opacity: 0.88 }}>
                      {brother.major}
                    </p>
                  )}
                  {bioText && (
                    <p style={{ color: mc.secondary, margin: '8px 0 0', fontSize: '14px', lineHeight: 1.55, opacity: 0.8 }}>
                      {bioText}
                    </p>
                  )}
                </div>

                {/* Metadata chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                  {brother.pledge_class && <span style={chipStyle}>{brother.pledge_class}</span>}
                  {brother.graduation_year && <span style={chipStyle}>Class of {brother.graduation_year}</span>}
                  <span style={chipStyle}>{brother.status === 'studying' ? 'Active Brother' : 'Alumni'}</span>
                  {brother.is_transfer === 1 && <span style={chipStyle}>Transfer</span>}
                </div>

                {/* Contact */}
                {(brother.linkedin_url || brother.instagram_url || brother.email) && (
                  <div>
                    <div style={sectionLabel}>Contact</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                      {brother.linkedin_url && (
                        <a
                          href={brother.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ ...secondaryAction, textDecoration: 'none', fontSize: '0.72rem' }}
                        >
                          LinkedIn ↗
                        </a>
                      )}
                      {brother.instagram_url && (
                        <a
                          href={brother.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ ...secondaryAction, textDecoration: 'none', fontSize: '0.72rem' }}
                        >
                          Instagram ↗
                        </a>
                      )}
                      {brother.email && (
                        <a
                          href={`mailto:${brother.email}`}
                          style={{
                            ...secondaryAction, textDecoration: 'none', fontSize: '0.72rem',
                            textTransform: 'none', letterSpacing: '0.02em', fontWeight: 600,
                          }}
                        >
                          {brother.email}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Fun facts / about */}
                {funFacts && (
                  <div>
                    <div style={sectionLabel}>About</div>
                    <p style={{ color: mc.secondary, margin: 0, fontSize: '13.5px', lineHeight: 1.6, opacity: 0.88 }}>
                      {funFacts}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '4px' }}>
                  {typeof onViewPoints === 'function' && brother?.id != null && (
                    <button type="button" onClick={() => onViewPoints(String(brother.id))} style={primaryAction}>
                      View Points
                    </button>
                  )}
                  <button type="button" onClick={enterEditMode} style={secondaryAction}>
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ── EDIT MODE ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: mc.text, fontWeight: 700 }}>Edit Profile</h2>

              {/* Photo upload */}
              <div>
                <div style={sectionLabel}>Profile Photo</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
                  {/* Preview */}
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    overflow: 'hidden', border: `2px solid ${hexToRgba(accentColor, 0.5)}`,
                    background: hexToRgba(accentColor, 0.12), display: 'grid', placeItems: 'center', flexShrink: 0,
                  }}>
                    {(photoPreviewUrl || formData.profile_image_url) ? (
                      <img
                        src={photoPreviewUrl || formData.profile_image_url}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <span style={{ fontSize: '1.6rem', fontWeight: 700, color: hexToRgba(accentColor, 0.8) }}>
                        {initials}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ ...secondaryAction, fontSize: '0.7rem' }}
                    >
                      {photoFile ? 'Change Photo' : 'Upload Photo'}
                    </button>
                    {photoFile && (
                      <span style={{ fontSize: '12px', color: mc.label, opacity: 0.8 }}>
                        {photoFile.name}
                      </span>
                    )}
                    <span style={{ fontSize: '11px', color: mc.label, opacity: 0.65 }}>
                      JPG, PNG or WebP · Max 5 MB
                    </span>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoSelect}
                    style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
                    tabIndex={-1}
                  />
                </div>

                {/* URL fallback (shows existing URL for reference / manual edit) */}
                <div style={{ marginTop: '10px', ...fieldStyle }}>
                  <label style={formLabelStyle}>Or paste image URL directly</label>
                  <input
                    type="url"
                    value={photoFile ? '' : formData.profile_image_url}
                    onChange={(e) => {
                      setPhotoFile(null);
                      setPhotoPreviewUrl('');
                      setFormData({ ...formData, profile_image_url: e.target.value });
                    }}
                    placeholder="https://..."
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Core fields */}
              <div style={formGridStyle}>
                <div style={fieldStyle}>
                  <label style={formLabelStyle}>Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={inputStyle} />
                </div>
                <div style={fieldStyle}>
                  <label style={formLabelStyle}>Pledge Class</label>
                  <input type="text" value={formData.pledge_class} onChange={(e) => setFormData({ ...formData, pledge_class: e.target.value })} style={inputStyle} />
                </div>
                <div style={fieldStyle}>
                  <label style={formLabelStyle}>Graduation Year</label>
                  <input
                    type="number"
                    value={formData.graduation_year}
                    onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value ? parseInt(e.target.value, 10) : '' })}
                    style={inputStyle}
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={formLabelStyle}>Major</label>
                  <input type="text" value={formData.major} onChange={(e) => setFormData({ ...formData, major: e.target.value })} style={inputStyle} />
                </div>
                <div style={fieldStyle}>
                  <label style={formLabelStyle}>Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} style={inputStyle}>
                    <option value="studying">Currently Studying</option>
                    <option value="graduated">Graduated</option>
                  </select>
                </div>
              </div>

              {/* Text areas */}
              <div style={{ display: 'grid', gap: '14px' }}>
                <div style={fieldStyle}>
                  <label style={formLabelStyle}>Bio (optional)</label>
                  <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} style={textAreaStyle} />
                </div>
                <div style={fieldStyle}>
                  <label style={formLabelStyle}>Career Aspirations (optional)</label>
                  <textarea value={formData.career_aspirations} onChange={(e) => setFormData({ ...formData, career_aspirations: e.target.value })} style={textAreaStyle} />
                </div>
                <div style={fieldStyle}>
                  <label style={formLabelStyle}>About / Fun Facts</label>
                  <textarea value={formData.fun_facts} onChange={(e) => setFormData({ ...formData, fun_facts: e.target.value })} style={textAreaStyle} />
                </div>
              </div>

              {/* Social / contact */}
              <div style={formGridStyle}>
                <div style={fieldStyle}>
                  <label style={formLabelStyle}>LinkedIn URL</label>
                  <input type="url" value={formData.linkedin_url} onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/username" style={inputStyle} />
                </div>
                <div style={fieldStyle}>
                  <label style={formLabelStyle}>Instagram URL</label>
                  <input type="url" value={formData.instagram_url} onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })} placeholder="https://instagram.com/username" style={inputStyle} />
                </div>
                <div style={fieldStyle}>
                  <label style={formLabelStyle}>Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={inputStyle} />
                </div>
              </div>

              {/* Transfer checkbox */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '9px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.is_transfer}
                  onChange={(e) => setFormData({ ...formData, is_transfer: e.target.checked })}
                />
                <span style={{ color: mc.text, fontSize: '14px' }}>Transfer Brother</span>
              </label>

              {/* Save / cancel */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingTop: '4px' }}>
                <button
                  onClick={handleSave}
                  disabled={saving || photoUploading}
                  style={{ ...primaryAction, opacity: (saving || photoUploading) ? 0.65 : 1, minWidth: '140px' }}
                >
                  {saving || photoUploading ? 'Saving…' : 'Save Changes'}
                </button>
                <button type="button" onClick={exitEditMode} style={{ ...secondaryAction, minWidth: '100px' }}>
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
