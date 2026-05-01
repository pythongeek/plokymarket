'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Download, Smartphone, Monitor } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleBeforeInstallPrompt = useCallback((e: Event) => {
    e.preventDefault();
    console.log('[PWA] Install prompt captured');
    setDeferredPrompt(e as BeforeInstallPromptEvent);
    setIsInstallable(true);

    // Check if not already dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = localStorage.getItem('pwa-install-dismissed-time');
    if (dismissed && dismissedTime) {
      const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) {
        setIsDismissed(true);
        return;
      }
    }

    // Show prompt after a delay to not be too intrusive
    setTimeout(() => {
      if (!isDismissed && !isInstalled) {
        setShowPrompt(true);
      }
    }, 3000);
  }, [isDismissed, isInstalled]);

  const handleAppInstalled = useCallback(() => {
    console.log('[PWA] App installed');
    setIsInstalled(true);
    setShowPrompt(false);
    setIsInstallable(false);
  }, []);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
    localStorage.setItem('pwa-install-dismissed-time', Date.now().toString());
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    console.log('[PWA] Installing app...');
    await deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Install prompt outcome:', outcome);

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowPrompt(false);
    }

    setDeferredPrompt(null);
    setIsInstallable(false);
  }, [deferredPrompt]);

  useEffect(() => {
    // Check if already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = localStorage.getItem('pwa-install-dismissed-time');
    if (dismissed && dismissedTime) {
      const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) {
        setIsDismissed(true);
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [handleBeforeInstallPrompt, handleAppInstalled]);

  // Don't show if already installed, not installable, dismissed, or no prompt
  if (isInstalled || !isInstallable || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
      <div className="pointer-events-auto max-w-md mx-auto bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div className="p-5">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <Smartphone className="w-7 h-7 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white mb-1">
                Install Plokymarket
              </h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Get the app for a faster, native experience with offline support and home screen access.
              </p>

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={handleInstall}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-violet-600 font-medium rounded-xl hover:bg-white/90 transition-colors shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  Install
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2.5 text-white/80 hover:text-white font-medium transition-colors text-sm"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/20">
            <Monitor className="w-4 h-4 text-white/60" />
            <span className="text-xs text-white/60">
              Works on iOS, Android, and desktop browsers
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to manage PWA installation
export function usePWAInstall() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleInstalled = () => setIsInstalled(true);
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    window.addEventListener('appinstalled', handleInstalled);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('appinstalled', handleInstalled);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setIsInstallable(false);
    return outcome === 'accepted';
  };

  return {
    isInstalled,
    isInstallable,
    install,
  };
}
