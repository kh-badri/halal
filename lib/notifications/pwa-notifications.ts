'use client';

/**
 * PWA Push Notification Utilities for Road To Halal
 * Supports Web Notifications API and Service Worker showNotification on Android & iOS 16.4+ (PWA)
 */

export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && 'serviceWorker' in navigator;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Play an elegant two-tone chime (D5 -> A5) using Web Audio API synth
 * Requires no external audio file assets and works cross-platform.
 */
export function playNotificationSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Note 1: D5 (587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Note 2: A5 (880.00 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.12);
    gain2.gain.setValueAtTime(0.22, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch (err) {
    // Audio context may be restricted by autoplay policy if not initiated by gesture
    console.debug('Notification audio note skipped:', err);
  }
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      playNotificationSound();
      // Send welcoming confirmation notification
      await showPushNotification('🔔 Notifikasi Pop-Up Aktif!', {
        body: 'Anda akan menerima pemberitahuan di layar HP saat calon pasangan mengirim pertanyaan atau jawaban baru.',
        url: '/tahap/proses-taaruf',
        tag: 'welcome-notification',
      });
    }
    return permission;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return Notification.permission;
  }
}

export interface PushNotificationOptions extends NotificationOptions {
  url?: string;
  playSound?: boolean;
}

/**
 * Convert URL-safe base64 string to Uint8Array for PushManager applicationServerKey
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe device to native Web Push and save subscription on the server.
 * Enables background screen pop-up notifications even when the app is completely closed.
 */
export async function subscribeUserToPush(
  role?: 'pria' | 'wanita',
  userId?: string
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.debug('PushManager is not supported by this browser environment');
    return false;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    if (!reg.pushManager) return false;

    // 1. Fetch VAPID Public Key from backend
    const keyRes = await fetch('/api/notifications/vapid-key');
    if (!keyRes.ok) {
      console.warn('Failed to retrieve VAPID key from server:', keyRes.status);
      return false;
    }
    const { publicKey } = await keyRes.json();
    if (!publicKey) return false;

    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    // 2. Subscribe or reuse existing subscription
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as BufferSource,
      });
    }

    if (!subscription) return false;

    // 3. Register subscription on the backend server
    const saveRes = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        role: role || 'pria',
        userId,
      }),
    });

    return saveRes.ok;
  } catch (err) {
    console.warn('Failed to subscribe user to Web Push:', err);
    return false;
  }
}

/**
 * Trigger immediate background server push test to verify that notifications work when closed
 */
export async function triggerServerPushTest(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/notifications/test', { method: 'POST' });
    const data = await res.json();
    return {
      success: Boolean(data.success),
      message: data.message || 'Respons server diterima',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Gagal menghubungi endpoint uji coba notifikasi.',
    };
  }
}

/**
 * Display a push notification on the device screen / notification drawer
 */
export async function showPushNotification(
  title: string,
  options?: PushNotificationOptions
): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  if (options?.playSound !== false) {
    playNotificationSound();
  }

  const defaultIcon = '/icons/icon-192x192.png';
  const notifOptions: any = {
    icon: defaultIcon,
    badge: defaultIcon,
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: options?.url || '/tahap/proses-taaruf',
      timestamp: Date.now(),
    },
    ...options,
  };

  // 1. Try using Service Worker registration (native Android/iOS PWA background pop-up)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, notifOptions);
        return true;
      }
    } catch (swErr) {
      console.warn('Service worker showNotification failed, attempting fallback:', swErr);
    }
  }

  // 2. Fallback to standard window.Notification constructor
  try {
    const notif = new Notification(title, notifOptions);
    notif.onclick = () => {
      window.focus();
      if (options?.url && typeof window !== 'undefined') {
        window.location.href = options.url;
      }
      notif.close();
    };
    return true;
  } catch (fallbackErr) {
    console.warn('Window Notification fallback failed:', fallbackErr);
    return false;
  }
}
