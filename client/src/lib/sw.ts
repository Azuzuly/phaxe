/**
 * Service Worker registration and management.
 */

let registration: ServiceWorkerRegistration | null = null;

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Service Workers not supported');
    return null;
  }

  try {
    registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

    registration.addEventListener('updatefound', () => {
      const newWorker = registration!.installing;
      newWorker?.addEventListener('statechange', () => {
        if (newWorker.state === 'activated') {
          console.log('[SW] Service Worker activated');
        }
      });
    });

    return registration;
  } catch (error) {
    console.error('[SW] Registration failed:', error);
    return null;
  }
}

export async function unregisterServiceWorker(): Promise<boolean> {
  if (registration) {
    const result = await registration.unregister();
    registration = null;
    return result;
  }
  return false;
}

/**
 * Send a message to the active service worker.
 */
export function sendMessageToSW(message: Record<string, unknown>): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (!navigator.serviceWorker.controller) {
      reject(new Error('No active service worker'));
      return;
    }

    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
      messageChannel.port1.close();
      resolve(event.data);
    };

    navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
  });
}

export function isServiceWorkerActive(): boolean {
  return !!navigator.serviceWorker.controller;
}
