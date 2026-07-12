// Hub Posts administration — publish announcements, newsletters, and
// deadlines to the Information Hub (Resources & Records screen).

import { useState, useEffect, useCallback } from 'react';
import { posts as postsApi } from '../api';

const TYPE_META = {
  announcement: { label: 'Announcement', color: 'var(--ncr-crimson)' },
  newsletter: { label: 'Newsletter', color: 'var(--ncr-gold)' },
  deadline: { label: 'Deadline', color: 'var(--ncr-green)' },
};

const EMPTY_FORM = { type: 'announcement', title: '', body: '', link_url: '', expires_at: '' };

const fmtDate = (v) => {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function PostsAdmin({ notify }) {
  const [postList, setPostList] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await postsApi.getAll();
      setPostList(Array.isArray(res.data) ? res.data : []);
      setLoadError('');
    } catch (err) {
      setPostList([]);
      setLoadError(err.response?.data?.error || 'Could not load posts — is the chapter server online?');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setF = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({
      type: p.type || 'announcement',
      title: p.title || '',
      body: p.body || '',
      link_url: p.link_url || '',
      expires_at: p.expires_at ? String(p.expires_at).slice(0, 10) : '',
    });
    window.scrollTo(0, 0);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      notify('A title is required.', 'error');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        type: form.type,
        title: form.title.trim(),
        body: form.body.trim() || null,
        link_url: form.link_url.trim() || null,
        expires_at: form.expires_at || null,
      };
      if (editingId) {
        await postsApi.update(editingId, payload);
        notify('Post updated in the Information Hub.');
      } else {
        await postsApi.create(payload);
        notify('Posted to the Information Hub.');
      }
      cancelEdit();
      await load();
    } catch (err) {
      notify(`Save failed: ${err.response?.data?.error || err.message || err}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete “${p.title}” from the Information Hub?`)) return;
    setBusy(true);
    try {
      await postsApi.remove(p.id);
      notify('Post deleted.');
      if (editingId === p.id) cancelEdit();
      await load();
    } catch (err) {
      notify(`Delete failed: ${err.response?.data?.error || err.message || err}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  const isExpired = (p) => p.expires_at && new Date(p.expires_at) < new Date();

  return (
    <div className="ncr-side-grid" style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 48, alignItems: 'start' }}>
      {/* Composer */}
      <form onSubmit={submit} className="ncr-card" style={{ padding: '24px 26px', borderTop: '4px solid var(--ncr-crimson)' }}>
        <div className="ncr-label ncr-label--gold" style={{ fontSize: 10.5, marginBottom: 16 }}>
          {editingId ? 'Edit Post' : 'New Post'}
        </div>

        <label className="ncr-field-label" htmlFor="post-type">Type</label>
        <select id="post-type" className="ncr-select" value={form.type} onChange={setF('type')} style={{ marginBottom: 18 }}>
          <option value="announcement">Announcement</option>
          <option value="newsletter">Newsletter</option>
          <option value="deadline">Deadline</option>
        </select>

        <label className="ncr-field-label" htmlFor="post-title">Title</label>
        <input
          id="post-title"
          className="ncr-input"
          value={form.title}
          onChange={setF('title')}
          placeholder={form.type === 'deadline' ? 'e.g. Dues close Oct 15' : 'e.g. Fall Rush schedule posted'}
          style={{ marginBottom: 18 }}
        />

        <label className="ncr-field-label" htmlFor="post-body">Details (optional)</label>
        <textarea
          id="post-body"
          className="ncr-textarea"
          rows={4}
          value={form.body}
          onChange={setF('body')}
          placeholder="Body text shown under the title."
          style={{ marginBottom: 18 }}
        />

        <label className="ncr-field-label" htmlFor="post-link">Link (optional — Drive PDF, form, etc.)</label>
        <input
          id="post-link"
          className="ncr-input"
          value={form.link_url}
          onChange={setF('link_url')}
          placeholder="https://…"
          style={{ marginBottom: 18 }}
        />

        <label className="ncr-field-label" htmlFor="post-expires">Expires (optional — hides after this date)</label>
        <input
          id="post-expires"
          className="ncr-input"
          type="date"
          value={form.expires_at}
          onChange={setF('expires_at')}
          style={{ marginBottom: 24 }}
        />

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" className="ncr-btn" disabled={busy} style={{ flex: 1, height: 46 }}>
            {busy ? 'Saving…' : editingId ? 'Save Changes' : 'Publish to the Hub'}
          </button>
          {editingId && (
            <button type="button" className="ncr-btn-ghost" onClick={cancelEdit} style={{ height: 46 }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Published list */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span className="ncr-label">Published Posts</span>
          <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 11, color: 'var(--ncr-muted)' }}>
            {postList ? postList.length : '…'} total
          </span>
        </div>
        {loadError && <div className="ncr-error" style={{ marginBottom: 12 }}>{loadError}</div>}
        <div style={{ borderTop: '1.5px solid var(--ncr-ink)' }}>
          {(postList || []).map((p) => {
            const meta = TYPE_META[p.type] || TYPE_META.announcement;
            return (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '13px 4px',
                  borderBottom: '1px solid var(--ncr-rule-faint)',
                  opacity: isExpired(p) ? 0.55 : 1,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--ncr-ui)',
                    fontSize: 9.5,
                    letterSpacing: '.14em',
                    textTransform: 'uppercase',
                    color: meta.color,
                    border: `1px solid ${meta.color}`,
                    padding: '3px 8px',
                    whiteSpace: 'nowrap',
                    marginTop: 2,
                  }}
                >
                  {meta.label}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--ncr-serif)', fontSize: 16, color: 'var(--ncr-ink)' }}>{p.title}</div>
                  <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 11.5, color: 'var(--ncr-muted)', marginTop: 3 }}>
                    Posted {fmtDate(p.posted_at)}
                    {p.expires_at ? ` · ${isExpired(p) ? 'Expired' : 'Expires'} ${fmtDate(p.expires_at)}` : ''}
                    {p.link_url ? ' · has link' : ''}
                  </div>
                </div>
                <button className="ncr-btn-ghost ncr-btn-ghost--soft" disabled={busy} onClick={() => startEdit(p)} style={{ padding: '5px 10px' }}>
                  Edit
                </button>
                <button
                  className="ncr-btn-ghost"
                  disabled={busy}
                  onClick={() => remove(p)}
                  style={{ color: 'var(--ncr-crimson-deep)', borderColor: 'var(--ncr-rule-soft)', padding: '5px 10px' }}
                >
                  Delete
                </button>
              </div>
            );
          })}
          {postList && !postList.length && !loadError && (
            <div className="ncr-italic" style={{ fontSize: 13, color: 'var(--ncr-muted)', padding: '16px 4px' }}>
              Nothing published yet — the Hub shows its empty states.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
