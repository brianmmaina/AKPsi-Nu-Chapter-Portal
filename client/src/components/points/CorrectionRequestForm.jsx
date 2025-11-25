import { useState } from 'react';

const VPAA_EMAIL = 'vpaa@akpsi-nu.org';

const defaultFormState = (memberName = '', defaultEventName = '') => ({
  eventName: defaultEventName || '',
  description: '',
  contact: memberName || '',
  email: '',
});

const CorrectionRequestForm = ({ memberName, defaultEventName, onClose }) => {
  const [formState, setFormState] = useState(defaultFormState(memberName, defaultEventName));
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleChange = (field) => (event) => {
    setFormState((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const subject = encodeURIComponent(`Points correction request for ${memberName || 'AKPsi member'}`);
    const body = [
      `Member: ${memberName || formState.contact || 'N/A'}`,
      `Event in question: ${formState.eventName || 'N/A'}`,
      '',
      formState.description || 'Describe the issue here.',
      '',
      `Contact: ${formState.contact || 'N/A'}`,
      `Email: ${formState.email || 'N/A'}`,
    ].join('\n');

    const mailtoLink = `mailto:${VPAA_EMAIL}?subject=${subject}&body=${encodeURIComponent(body)}`;
    if (typeof window !== 'undefined') {
      window.location.href = mailtoLink;
    }
    setHasSubmitted(true);
    onClose?.();
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        border: '1px solid rgba(14,165,233,0.35)',
        borderRadius: '16px',
        padding: '16px',
        background: 'rgba(236,254,255,0.7)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ fontWeight: 600, color: '#0c4a6e' }}>
        Quick correction request (opens your email client)
      </div>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '14px', color: '#0f172a' }}>
        Event
        <input
          type="text"
          value={formState.eventName}
          onChange={handleChange('eventName')}
          placeholder="Ex: Chapter 4 attendance"
          style={{
            borderRadius: '12px',
            border: '1px solid rgba(15,23,42,0.15)',
            padding: '8px 12px',
          }}
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '14px', color: '#0f172a' }}>
        What needs to be updated?
        <textarea
          value={formState.description}
          onChange={handleChange('description')}
          placeholder="Briefly explain the issue. No fines or J-Board info appear publicly."
          rows={3}
          style={{
            borderRadius: '12px',
            border: '1px solid rgba(15,23,42,0.15)',
            padding: '8px 12px',
            resize: 'vertical',
          }}
        />
      </label>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <label style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 4, fontSize: '14px', color: '#0f172a' }}>
          Your name
          <input
            type="text"
            value={formState.contact}
            onChange={handleChange('contact')}
            placeholder="Name"
            style={{
              borderRadius: '12px',
              border: '1px solid rgba(15,23,42,0.15)',
              padding: '8px 12px',
            }}
          />
        </label>
        <label style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 4, fontSize: '14px', color: '#0f172a' }}>
          Email
          <input
            type="email"
            value={formState.email}
            onChange={handleChange('email')}
            placeholder="email@university.edu"
            style={{
              borderRadius: '12px',
              border: '1px solid rgba(15,23,42,0.15)',
              padding: '8px 12px',
            }}
          />
        </label>
      </div>
      <button
        type="submit"
        style={{
          borderRadius: '999px',
          border: 'none',
          background: '#0ea5e9',
          color: '#fff',
          fontWeight: 600,
          padding: '10px 18px',
          cursor: 'pointer',
        }}
      >
        Email VPAA
      </button>
      {hasSubmitted && (
        <div style={{ fontSize: '13px', color: '#0369a1' }}>
          If your mail app didn’t open automatically, email {VPAA_EMAIL} with the info above.
        </div>
      )}
    </form>
  );
};

export default CorrectionRequestForm;

