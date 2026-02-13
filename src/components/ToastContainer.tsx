import { useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import type { Notification, NotificationType } from '../types/notification';

const AUTO_DISMISS_DELAY = 5000; // 5 seconds

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

function ToastItem({ notification, onDismiss }: { notification: Notification; onDismiss: () => void }) {
  useEffect(() => {
    // Only auto-dismiss success and info notifications
    // Error and warning notifications remain pinned until manually dismissed
    if (notification.type === 'success' || notification.type === 'info') {
      const timer = setTimeout(() => {
        onDismiss();
      }, AUTO_DISMISS_DELAY);

      return () => clearTimeout(timer);
    }
  }, [onDismiss, notification.type]);

  return (
    <div
      role="alert"
      className={`alert ${getAlertClass(notification.type)} shadow-lg`}
      data-testid={`toast-${notification.id}`}
    >
      <div className="flex-1">
        <span>{notification.message}</span>
      </div>
      <button
        className="btn btn-sm btn-ghost btn-circle"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { notifications, clearNotification } = useNotifications();

  // Only show the 3 most recent unread notifications as toasts
  const toasts = notifications.filter((n) => !n.read).slice(0, 3);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast toast-end toast-top z-[9999]" data-testid="toast-container">
      {toasts.map((notification) => (
        <ToastItem
          key={notification.id}
          notification={notification}
          onDismiss={() => clearNotification(notification.id)}
        />
      ))}
    </div>
  );
}
