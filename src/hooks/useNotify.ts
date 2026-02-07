import { useMemo } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import type { NotificationType } from '../types/notification';

export function useNotify() {
  const { addNotification } = useNotifications();

  return useMemo(
    () => ({
      success: (message: string) => addNotification('success', message),
      error: (message: string) => addNotification('error', message),
      warning: (message: string) => addNotification('warning', message),
      info: (message: string) => addNotification('info', message),
      notify: (type: NotificationType, message: string) => addNotification(type, message),
    }),
    [addNotification],
  );
}
