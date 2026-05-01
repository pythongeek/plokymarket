'use client';

import { useState, useEffect, useCallback } from 'react';

interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isReady: boolean;
  registration: ServiceWorkerRegistration | null;
  version: string | null;
}

export function useServiceWorker() {
  const [status, setStatus] = useState<ServiceWorkerStatus>({
    isSupported: false,
    isRegistered: false,
    isReady: false,
    registration: null,
    version: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isSupported = 'serviceWorker' in navigator;
    setStatus((prev) => ({ ...prev, isSupported }));

    if (!isSupported) return;

    // Check if there's an active service worker
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        setStatus((prev) => ({
          ...prev,
          isRegistered: true,
          isReady: registration.active !== null,
          registration,
        }));

        // Get version if available
        if (registration.active) {
          registration.active.postMessage({ type: 'GET_VERSION' });
        }
      }
    });

    // Listen for messages from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'VERSION') {
        setStatus((prev) => ({ ...prev, version: event.data.version }));
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    // Register service worker
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW] Registration successful:', registration.scope);

        registration.addEventListener('updatefound', () => {
          console.log('[SW] New service worker found');
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[SW] New content is available');
                // Could trigger a notification here
              }
            });
          }
        });

        setStatus((prev) => ({
          ...prev,
          isRegistered: true,
          isReady: registration.active !== null,
          registration,
        }));
      })
      .catch((error) => {
        console.error('[SW] Registration failed:', error);
      });

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  const update = useCallback(async () => {
    if (!status.registration) return;

    try {
      await status.registration.update();
      console.log('[SW] Update check completed');
    } catch (error) {
      console.error('[SW] Update check failed:', error);
    }
  }, [status.registration]);

  const unregister = useCallback(async () => {
    if (!status.registration) return;

    try {
      const result = await status.registration.unregister();
      console.log('[SW] Unregistration:', result);
      setStatus((prev) => ({
        ...prev,
        isRegistered: false,
        isReady: false,
        registration: null,
      }));
      return result;
    } catch (error) {
      console.error('[SW] Unregistration failed:', error);
      return false;
    }
  }, [status.registration]);

  const clearCache = useCallback(async () => {
    if (!status.registration?.active) return;

    status.registration.active.postMessage({ type: 'CLEAR_CACHE' });
    console.log('[SW] Cache clear requested');
  }, [status.registration]);

  return {
    ...status,
    update,
    unregister,
    clearCache,
  };
}
