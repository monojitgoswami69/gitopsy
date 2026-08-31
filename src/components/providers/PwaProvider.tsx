"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Download, X } from "lucide-react";
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

      // Only show the prompt on the very first time the user uses the app
      try {
        const hasBeenPrompted = localStorage.getItem("gitopsy_pwa_prompt_shown");
        const isDismissed = localStorage.getItem("gitopsy_pwa_dismissed");
        const isInstalled = localStorage.getItem("gitopsy_pwa_installed");

        if (!hasBeenPrompted && !isDismissed && !isInstalled) {
          setShowInstallBanner(true);
          localStorage.setItem("gitopsy_pwa_prompt_shown", "true");
        }
      } catch {
        // localStorage may be unavailable in private browsing
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Track app installation
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
      setIsStandalone(true);
      try {
        localStorage.setItem("gitopsy_pwa_installed", "true");
      } catch {
        // localStorage may be unavailable in private browsing
      }
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setShowInstallBanner(false);
        try {
          localStorage.setItem("gitopsy_pwa_installed", "true");
        } catch {
          // localStorage may be unavailable in private browsing
        }
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
      localStorage.setItem("gitopsy_pwa_dismissed", "true");
    } catch {
      // localStorage may be unavailable in private browsing
    }
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

      {/* Modern, Refined Install Notification Banner */}
      {showInstallBanner && !isStandalone && !dismissed && (
        <aside
          role="region"
          aria-label="Install Gitopsy Web Application"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-3 duration-300"
        >
          <div className="border-[1.5px] border-black/80 bg-[#FFFDF9]/95 backdrop-blur-md p-3.5 sm:p-4 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,0.85)] flex flex-col gap-3 text-black">
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5">
                <Download className="size-5 text-black stroke-[2.2] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-tight text-neutral-900 mb-0.5">
                    INSTALL GITOPSY
                  </h4>
                  <p className="text-[11px] font-medium text-neutral-700 leading-snug">
                    Offline dossier access &amp; instant desktop or mobile launching.
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismissBanner}
                className="text-neutral-400 hover:text-black p-1 hover:bg-black/5 rounded-md cursor-pointer transition-colors shrink-0"
                aria-label="Dismiss install prompt"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/10">
              <button
                type="button"
                onClick={handleDismissBanner}
                className="text-[11px] font-bold text-neutral-600 hover:text-neutral-900 px-2.5 py-1.5 rounded-md hover:bg-black/5 transition-colors cursor-pointer"
              >
                LATER
              </button>
              <Button
                size="sm"
                variant="main"
                onClick={installApp}
                className="text-[11px] py-1 px-3 h-8 shadow-[1.5px_1.5px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] flex items-center gap-1.5"
              >
                <Download className="size-3 stroke-[2.5]" />
                <span>INSTALL APP</span>
              </Button>
            </div>
          </div>
        </aside>
      )}
    </PwaContext.Provider>
  );
}
