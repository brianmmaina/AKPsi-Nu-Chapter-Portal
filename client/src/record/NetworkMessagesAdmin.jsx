// Network Admin · Messages tab — compose a one-way message to any approved
// member, view the full inbox (all recipients), delete.

import { useState } from 'react';

const svc = () => import('./networkService');

export default function NetworkMessagesAdmin({ approvedUsers, messages, netUser, run }) {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!recipient || !subject.trim() || !body.trim()) return;
    setBusy(true);
    const target = approvedUsers.find((u) => u.email === recipient);
    const api = await svc();
    const ok = await run(
      () => api.sendPortalMessage({
        recipientEmail: recipient,
        recipientName: target?.name || '',
        subject: subject.trim(),
        body: body.trim(),
        senderEmail: netUser?.email,
        senderName: netUser?.name,
      }),
      `Message sent to ${recipient}.`,
    );
    if (ok) {
      setSubject('');
      setBody('');
    }
    setBusy(false);
  };

  const remove = async (msg) => {
    if (!window.confirm(`Delete this message to ${msg.recipientEmail}?`)) return;
    const api = await svc();
    await run(() => api.deleteMessage(msg.id), 'Message deleted.');
  };

  return (
    <div>
      <div style={{ maxWidth: 560, marginBottom: 34 }}>
        <div className="ncr-field-label" style={{ marginBottom: 10 }}>Compose</div>
        <select className="ncr-select" value={recipient} onChange={(e) => setRecipient(e.target.value)} style={{ marginBottom: 10 }}>
          <option value="">Select a recipient…</option>
          {approvedUsers.map((u) => (
            <option key={u.id} value={u.email}>{u.email}</option>
          ))}
        </select>
        <input className="ncr-input" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} style={{ marginBottom: 10 }} />
        <textarea className="ncr-textarea" rows={4} placeholder="Message" value={body} onChange={(e) => setBody(e.target.value)} style={{ marginBottom: 10 }} />
        <button className="ncr-btn" onClick={send} disabled={busy || !recipient || !subject.trim() || !body.trim()}>
          {busy ? 'Sending…' : 'Send'}
        </button>
      </div>

      <div className="ncr-field-label" style={{ marginBottom: 14 }}>Inbox ({messages.length})</div>
      {messages.map((msg) => (
        <div key={msg.id} className="ncr-card" style={{ padding: '14px 20px', marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'var(--ncr-serif)', fontSize: 15, fontWeight: 700, color: 'var(--ncr-ink)' }}>{msg.subject}</div>
              <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 11.5, color: 'var(--ncr-muted)', marginTop: 2 }}>
                To {msg.recipientEmail} · <span style={{ textTransform: 'capitalize' }}>{msg.status}</span>
              </div>
            </div>
            <button className="ncr-link-btn" onClick={() => remove(msg)} style={{ color: 'var(--ncr-crimson)', fontSize: 11 }}>Delete</button>
          </div>
          {msg.replyText && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--ncr-rule)', fontFamily: 'var(--ncr-ui)', fontSize: 12.5, color: 'var(--ncr-ink-mid)' }}>
              <strong>Reply:</strong> {msg.replyText}
            </div>
          )}
        </div>
      ))}
      {messages.length === 0 && (
        <div style={{ color: 'var(--ncr-muted)', fontFamily: 'var(--ncr-ui)', fontSize: 12.5 }}>No messages sent yet.</div>
      )}
    </div>
  );
}
