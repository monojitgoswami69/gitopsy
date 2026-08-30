"use client";

import React, { useEffect } from "react";
import Lenis from "lenis";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const isTouchOrResponsive = () => {
      if (typeof window === "undefined") return false;
      return (
        window.matchMedia("(pointer: coarse)").matches ||
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth < 1024
      );
    };

    const scrollContainer = document.getElementById("app-main-scroll");
    if (!scrollContainer) return;

    let lenis: Lenis | null = null;
    let animationFrameId: number | null = null;

    const initLenis = () => {
      if (isTouchOrResponsive() || !scrollContainer) {
        if (lenis) {
          lenis.destroy();
          lenis = null;
        }
        return;
      }

      if (!lenis) {
        try {
          lenis = new Lenis({
            wrapper: scrollContainer,
            duration: 1.0,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: "vertical",
            gestureOrientation: "vertical",
            smoothWheel: true,
            syncTouch: false,
            wheelMultiplier: 0.9,
            touchMultiplier: 0,
          });

          const raf = (time: number) => {
            if (lenis) {
              lenis.raf(time);
              animationFrameId = requestAnimationFrame(raf);
            }
          };

          animationFrameId = requestAnimationFrame(raf);
        } catch {
          lenis = null;
        }
      }
    };

    initLenis();

    const handleResize = () => {
      initLenis();
    };

    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      if (lenis) {
        lenis.destroy();
        lenis = null;
      }
    };
  }, []);

  return <>{children}</>;
}
