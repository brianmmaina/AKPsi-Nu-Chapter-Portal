// One section (DEI Hub / Job Board / Family Updates) inside NetworkScreen —
// ties together the shared card/form components with a "new post" button
// and the posting-rights gate for that section.

import NetworkContentCard from './NetworkContentCard';
import NetworkContentForm from './NetworkContentForm';

export default function NetworkContentSection({
  posts,
  editing,
  busy,
  canPost,
  canEditPost,
  onNew,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  extraFields,
  header,
}) {
  if (editing !== undefined) {
    return (
      <div>
        {header}
        <NetworkContentForm initial={editing} extraFields={extraFields} onSave={onSave} onCancel={onCancel} saving={busy} />
      </div>
    );
  }

  return (
    <div>
      {header}
      {canPost && (
        <button className="ncr-btn-ghost" onClick={onNew} style={{ height: 38, marginBottom: 20 }}>
          + New Post
        </button>
      )}
      {posts.length === 0 && (
        <div style={{ color: 'var(--ncr-muted)', fontFamily: 'var(--ncr-ui)', fontSize: 12.5 }}>
          Nothing posted here yet.
        </div>
      )}
      {posts.map((post) => (
        <NetworkContentCard
          key={post.id}
          post={post}
          canEdit={canEditPost(post)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
