export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: number;
  read: boolean;
}

export interface NotificationContextValue {
  notifications: Notification[];
  addNotification: (type: NotificationType, message: string) => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
  markAsRead: (id: string) => void;
}
