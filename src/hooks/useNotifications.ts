import { useEffect, useState, useCallback } from 'react';

type NotificationPermission = 'default' | 'granted' | 'denied' | 'unsupported';

export function useNotifications(enabled: boolean) {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (!('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission as NotificationPermission);
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'unsupported' as NotificationPermission;
    const result = await Notification.requestPermission();
    setPermission(result as NotificationPermission);
    return result as NotificationPermission;
  }, []);

  const notify = useCallback(
    (title: string, body: string) => {
      if (!enabled || !('Notification' in window) || Notification.permission !== 'granted') return;
      new Notification(title, { body });
    },
    [enabled]
  );

  return { permission, requestPermission, notify };
}
