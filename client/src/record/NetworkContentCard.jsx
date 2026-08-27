// Shared post card for DEI Hub / Job Board / Family Updates — the three
// Firestore content types share the same shape (title, body, cover image,
// author, status), so one card renders all three.

export default function NetworkContentCard({ post, meta, canEdit, onEdit, onDelete }) {
  return (
    <div className="ncr-card" style={{ padding: '18px 22px', marginBottom: 14, display: 'flex', gap: 18 }}>
      {post.coverImageUrl && (
        <img
          src={post.coverImageUrl}
          alt={post.imageAlt || ''}
          style={{ width: 96, height: 96, objectFit: 'cover', border: '1px solid var(--ncr-rule)', flexShrink: 0 }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
          <div style={{ fontFamily: 'var(--ncr-serif)', fontSize: 18, fontWeight: 700, color: 'var(--ncr-ink)' }}>
            {post.title}
          </div>
          {canEdit && (
            <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
              <button className="ncr-link-btn" onClick={() => onEdit(post)} style={{ fontSize: 11 }}>Edit</button>
              <button className="ncr-link-btn" onClick={() => onDelete(post)} style={{ color: 'var(--ncr-crimson)', fontSize: 11 }}>Delete</button>
            </div>
          )}
        </div>
        {meta && (
          <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 11.5, letterSpacing: '.06em', color: 'var(--ncr-muted)', marginTop: 2 }}>
            {meta}
          </div>
        )}
        <p style={{ fontFamily: 'var(--ncr-ui)', fontSize: 13.5, color: 'var(--ncr-ink-mid)', lineHeight: 1.55, margin: '10px 0 0', whiteSpace: 'pre-wrap' }}>
          {post.body}
        </p>
        {post.link && (
          <a href={post.link} target="_blank" rel="noopener noreferrer" className="ncr-link-btn" style={{ fontSize: 11, display: 'inline-block', marginTop: 10 }}>
            View link →
          </a>
        )}
        <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 10.5, letterSpacing: '.1em', color: 'var(--ncr-faint)', marginTop: 12 }}>
          {post.authorName || post.authorEmail}
        </div>
      </div>
    </div>
  );
}
