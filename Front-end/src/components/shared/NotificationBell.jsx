// NotificationBell.jsx
export default function NotificationBell({ notifications = [], unreadCount = 0 }) {
  return (
    <div className="bg-surface border border-border rounded-lg shadow-lg p-3 max-w-xs">
      <h4 className="font-bold mb-2 text-sm">الإشعارات ({unreadCount})</h4>
      <ul className="space-y-2 max-h-48 overflow-y-auto">
        {notifications.map(n => (
          <li key={n.id} className={`p-2 rounded text-xs ${n.is_read ? 'bg-gray-50' : 'bg-primary/5 border-r-2 border-primary'}`}>
            <p className="font-medium">{n.title}</p>
            <p className="text-text-muted mt-0.5">{n.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}