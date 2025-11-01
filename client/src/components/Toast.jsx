import { useEffect } from 'react';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const typeStyles = {
    success: {
      bg: 'var(--success)',
      border: 'var(--success)',
    },
    error: {
      bg: 'var(--danger)',
      border: 'var(--danger)',
    },
    info: {
      bg: 'var(--info)',
      border: 'var(--info)',
    },
    warning: {
      bg: 'var(--warning)',
      border: 'var(--warning)',
    },
  }[type] || typeStyles.info;

  return (
    <div
      className="glass-panel-elevated fixed top-4 right-4 z-toast rounded-lg shadow-xl fade-zoom"
      role="alert"
      aria-live="polite"
      style={{
        padding: 'var(--space-4) var(--space-5)',
        backgroundColor: typeStyles.bg,
        borderColor: typeStyles.border,
        color: 'white',
        minWidth: '300px',
        maxWidth: '400px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
        <span
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-medium)',
            lineHeight: 'var(--leading-normal)',
          }}
        >
          {message}
        </span>
        <button
          onClick={onClose}
          className="btn btn-sm"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            padding: 'var(--space-1)',
            fontSize: 'var(--text-xl)',
            lineHeight: '1',
            minWidth: 'auto',
          }}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;

