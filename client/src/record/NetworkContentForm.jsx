// Shared post form for DEI Hub / Job Board / Family Updates. `extraFields`
// describes the type-specific inputs beyond title/body/cover image —
// [{ key, label, type: 'text'|'select', options? }].

import { useState } from 'react';

export default function NetworkContentForm({ initial, extraFields, onSave, onCancel, saving }) {
  const [form, setForm] = useState({ title: '', body: '', ...initial });
  const [imageFile, setImageFile] = useState(null);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="ncr-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="ncr-field-label" htmlFor="ncf-title">Title</label>
          <input id="ncf-title" className="ncr-input" value={form.title} onChange={setField('title')} />
        </div>

        {extraFields.map((f) =>
          f.type === 'select' ? (
            <div key={f.key}>
              <label className="ncr-field-label" htmlFor={`ncf-${f.key}`}>{f.label}</label>
              <select id={`ncf-${f.key}`} className="ncr-select" value={form[f.key] || ''} onChange={setField(f.key)}>
                {f.options.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          ) : (
            <div key={f.key}>
              <label className="ncr-field-label" htmlFor={`ncf-${f.key}`}>{f.label}</label>
              <input id={`ncf-${f.key}`} className="ncr-input" value={form[f.key] || ''} onChange={setField(f.key)} />
            </div>
          ),
        )}

        <div style={{ gridColumn: '1 / -1' }}>
          <label className="ncr-field-label" htmlFor="ncf-body">Description</label>
          <textarea id="ncf-body" className="ncr-textarea" rows={5} value={form.body} onChange={setField('body')} />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label className="ncr-field-label" htmlFor="ncf-image">Cover Image (optional)</label>
          <input id="ncf-image" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
        </div>

        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 14, marginTop: 6 }}>
          <button className="ncr-btn" onClick={() => onSave(form, imageFile)} disabled={saving || !form.title.trim()}>
            {saving ? 'Saving…' : initial?.id ? 'Save Changes' : 'Publish'}
          </button>
          <button className="ncr-btn-ghost ncr-btn-ghost--soft" onClick={onCancel} style={{ height: 48, padding: '0 24px', fontSize: 11, letterSpacing: '.22em' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
