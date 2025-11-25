import { createPortal } from 'react-dom';
import MemberPointsDetail from './MemberPointsDetail';

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  background: 'rgba(15, 23, 42, 0.6)',
  zIndex: 200,
  padding: '24px',
};

const cardStyle = {
  width: 'min(720px, 95vw)',
  maxHeight: '92vh',
  overflowY: 'auto',
  background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.9) 100%)',
  borderRadius: '24px',
  padding: '28px',
  boxShadow: '0 35px 80px rgba(15, 23, 42, 0.35)',
};

const MemberPointsDetailModal = ({ isOpen, onClose, member, events, timeframe }) => {
  if (typeof document === 'undefined' || !isOpen) {
    return null;
  }

  return createPortal(
    <div style={overlayStyle} onClick={onClose} role="dialog" aria-modal="true">
      <div style={cardStyle} onClick={(event) => event.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close points detail"
            style={{
              background: 'rgba(15,23,42,0.08)',
              border: 'none',
              borderRadius: '12px',
              width: 32,
              height: 32,
              cursor: 'pointer',
              fontSize: 18,
            }}
          >
            ×
          </button>
        </div>
        <MemberPointsDetail member={member} events={events} timeframe={timeframe} />
      </div>
    </div>,
    document.body,
  );
};

export default MemberPointsDetailModal;

