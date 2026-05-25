function formatMessageDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function GuestMessageList({ messages, emptyHint }) {
  if (!messages?.length) {
    return emptyHint ? <p className="guest-messages-empty">{emptyHint}</p> : null
  }

  return (
    <ul className="guest-messages-list">
      {messages.map((m) => (
        <li key={m.id} className="guest-message-card">
          <p className="guest-message-text">{m.messageText}</p>
          <p className="guest-message-meta">
            <strong>{m.authorName}</strong>
            {m.createdAt ? <span>{formatMessageDate(m.createdAt)}</span> : null}
          </p>
        </li>
      ))}
    </ul>
  )
}
