import { useNotifications } from '../contexts/NotificationContext';
import type { Notification, NotificationType } from '../types/notification';

function getAlertClass(type: NotificationType): string {
  switch (type) {
    case 'success':
      return 'alert-success';
    case 'error':
      return 'alert-error';
    case 'warning':
      return 'alert-warning';
    case 'info':
      return 'alert-info';
    default:
      return '';
  }
}

function getTypeIcon(type: NotificationType): string {
  switch (type) {
    case 'success':
      return '✓';
    case 'error':
      return '✕';
    case 'warning':
      return '⚠';
    case 'info':
      return 'ℹ';
    default:
      return '';
  }
}

function NotificationItem({ 
  notification,
  onClear,
}: { 
  notification: Notification;
  onClear: (id: string) => void;
}) {
  const date = new Date(notification.timestamp);
  const formattedDate = date.toLocaleString();

  return (
    <div
      role="listitem"
      className={`alert ${getAlertClass(notification.type)} mb-2`}
      data-testid={`notification-item-${notification.id}`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-label={`${notification.type} notification`}>
            {getTypeIcon(notification.type)}
          </span>
          <div className="flex-1">
            <p className="font-semibold">{notification.message}</p>
            <p className="text-sm opacity-70">{formattedDate}</p>
          </div>
        </div>
      </div>
      <button
        className="btn btn-sm btn-ghost btn-circle"
        onClick={() => onClear(notification.id)}
        aria-label="Clear notification"
        data-testid={`clear-notification-${notification.id}`}
      >
        ✕
      </button>
    </div>
  );
}

export function NotificationsPage() {
  const { notifications, clearNotification, clearAll } = useNotifications();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        {notifications.length > 0 && (
          <button 
            className="btn btn-outline btn-error" 
            onClick={clearAll}
            data-testid="clear-all-notifications"
          >
            Clear All
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="alert alert-info">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>No notifications yet.</span>
        </div>
      ) : (
        <div role="list">
          {notifications.map((notification) => (
            <NotificationItem 
              key={notification.id} 
              notification={notification}
              onClear={clearNotification}
            />
          ))}
        </div>
      )}
    </div>
  );
}
