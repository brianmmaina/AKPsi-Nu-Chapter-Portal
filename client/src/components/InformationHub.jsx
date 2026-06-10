import { useState } from 'react';
import PointsAdminLauncher from './points/admin/PointsAdminLauncher';

const InformationHub = ({ onBack, onBackToHome, canGoBack }) => {
  const [showAdmin, setShowAdmin] = useState(false);

  return (
    <div className="info-hub info-hub--archive">
      <div className="info-hub__bg-image" aria-hidden />
      <div className="info-hub__inner">
        <header className="info-hub__header">
          <div className="info-hub__header-text">
            <p className="eyebrow">AKPsi Nu Chapter</p>
            <h1>Information Hub</h1>
            <p className="subtitle">
              Centralized space for calendars, newsletters, updates, and important deadlines.
            </p>
          </div>
          <div className="info-hub__nav-buttons">
            <button
              type="button"
              className="nav-button"
              onClick={onBackToHome}
              style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', color: '#0f0f0f' }}
            >
              Back to Home
            </button>
          </div>
        </header>

        <div className="info-hub-grid">
          {/* ── Left: Academic Resources ── */}
          <div className="hub-card hub-card--resources">
            <h2 className="hub-card__title">Academic Resources</h2>
            <div className="hub-card__divider" />
            <div className="hub-card__embed-wrap">
              <iframe
                src="https://drive.google.com/embeddedfolderview?id=1_FMR0XyMjn7TzCZ_PZA-b2GdMfIFGCPY#grid"
                width="100%"
                height="100%"
                frameBorder="0"
                className="hub-card__iframe"
                title="Academic Resources - Google Drive"
              />
            </div>
            <div className="hub-card__footer">
              <a
                href="https://drive.google.com/drive/folders/1_FMR0XyMjn7TzCZ_PZA-b2GdMfIFGCPY?usp=drive_link"
                target="_blank"
                rel="noopener noreferrer"
                className="hub-card__drive-link"
              >
                Open in Google Drive →
              </a>
            </div>
          </div>

          {/* ── Right: stacked cards ── */}
          <div className="side-stack">
            <div className="hub-card hub-card--newsletter">
              <h2 className="hub-card__title">Newsletter</h2>
              <div className="hub-card__divider" />
              <p className="hub-card__empty-label">No newsletter posted yet.</p>
              <p className="hub-card__empty-sub">The latest chapter newsletter will appear here when available.</p>
            </div>

            <div className="hub-card hub-card--updates">
              <h2 className="hub-card__title">Updates & Deadlines</h2>
              <div className="hub-card__divider" />
              <p className="hub-card__empty-label">No active deadlines yet.</p>
              <p className="hub-card__empty-sub">New reminders and requirements will appear here when posted.</p>
            </div>
          </div>
        </div>
      </div>

      {showAdmin && (
        <div className="points-admin-overlay">
          <PointsAdminLauncher onClose={() => setShowAdmin(false)} />
        </div>
      )}
    </div>
  );
};

export default InformationHub;
