"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Download, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface PwaContextType {
  isInstallable: boolean;
  isStandalone: boolean;
  installApp: () => Promise<void>;
}

const PwaContext = createContext<PwaContextType>({
  isInstallable: false,
  isStandalone: false,
  installApp: async () => {},
});

export function usePwa() {
  return useContext(PwaContext);
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if running in standalone PWA mode
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes("android-app://");
      setIsStandalone(Boolean(isStandaloneMode));
    };

    checkStandalone();

    // Register Service Worker
    if ("serviceWorker" in navigator && process.env.NODE_ENV !== "test") {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .catch(() => {
            // Silently handle sw registration failure in restricted sandbox
          });
      });
    }

    // Capture beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Check if user dismissed recently (session)
      const isDismissed = sessionStorage.getItem("gitopsy_pwa_dismissed");
      if (!isDismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Track app installation
    window.addEventListener("appinstalled", () => {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
      setIsStandalone(true);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    } catch {
      // Ignore user cancellation
    }
  }, [deferredPrompt]);

  const handleDismissBanner = () => {
    setShowInstallBanner(false);
    setDismissed(true);
    try {
      sessionStorage.setItem("gitopsy_pwa_dismissed", "true");
    } catch {}
  };

  return (
    <PwaContext.Provider
      value={{
        isInstallable: Boolean(deferredPrompt),
        isStandalone,
        installApp,
      }}
    >
      {children}

      {/* Neobrutalist Install Notification Banner */}
      {showInstallBanner && !isStandalone && !dismissed && (
        <aside
          role="region"
          aria-label="Install Gitopsy Web Application"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <div className="border-[3px] border-black bg-[#FFFBEB] p-4 rounded-[12px] shadow-[4px_4px_0_0_#000] flex flex-col gap-3 text-black">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-[6px] border-2 border-black bg-[#FFDC58] flex items-center justify-center shrink-0">
                  <Download className="size-4 text-black stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-tight">INSTALL GITOPSY APP</h4>
                  <p className="text-[11px] font-bold text-gray-700">
                    Offline dossier access &amp; instant desktop/mobile launching.
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismissBanner}
                className="text-gray-500 hover:text-black p-1 hover:bg-black/5 rounded cursor-pointer transition-colors"
                aria-label="Dismiss install prompt"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-black/15">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDismissBanner}
                className="text-[11px] py-1 h-auto"
              >
                LATER
              </Button>
              <Button
                size="sm"
                variant="main"
                onClick={installApp}
                className="text-[11px] py-1 h-auto flex items-center gap-1.5"
              >
                <Sparkles className="size-3" />
                <span>INSTALL</span>
              </Button>
            </div>
          </div>
        </aside>
      )}
    </PwaContext.Provider>
  );
}
