import { GripIntention } from '../types/grip';

/**
 * Service to manage the ongoing persistent Android status bar / notification shade notification
 * for "على بالك" (Intentions & Mind Dump), as requested by the user.
 * 
 * Shows up when the user pulls down the notification shade from top of screen on Android.
 */

const NOTIFICATION_TAG = 'grip-ongoing-ala-balak';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission === 'denied') {
    return false;
  }
  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return false;
  }
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function isNotificationGranted(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
}

/**
 * Updates or creates the persistent notification in the Android notification shade.
 */
export async function updateOngoingAlaBalakNotification(intentions: GripIntention[]): Promise<boolean> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const activeIntentions = intentions.filter((i) => !i.completed);

  const title = 'على بالك';
  const body =
    activeIntentions.length > 0
      ? activeIntentions.map((i, idx) => `${idx + 1}. ${i.text}`).join('\n')
      : 'لا توجد نوايا معلقة حالياً - ذهنك صافٍ ومستعد';

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: NOTIFICATION_TAG,
          requireInteraction: true,
          silent: true,
          data: {
            url: '/',
            timestamp: Date.now(),
          },
        } as any);
        return true;
      }
    }

    // Fallback to standard window Notification
    new Notification(title, {
      body,
      icon: '/icon-192.png',
      tag: NOTIFICATION_TAG,
      requireInteraction: true,
      silent: true,
    });
    return true;
  } catch (err) {
    console.warn('Could not post ongoing notification:', err);
    return false;
  }
}

/**
 * Dismisses the persistent ongoing notification if needed.
 */
export async function clearOngoingAlaBalakNotification(): Promise<void> {
  if (!isNotificationSupported()) return;
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      const notifs = await reg.getNotifications({ tag: NOTIFICATION_TAG });
      notifs.forEach((n) => n.close());
    }
  } catch (err) {
    // Ignore error
  }
}
