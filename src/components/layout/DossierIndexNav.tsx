"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowUp, List, ChevronRight, ChevronUp, X } from "lucide-react";

interface SectionItem {
  id: string;
  label: string;
}

const SECTIONS: SectionItem[] = [
  { id: "section-headlines", label: "Case Summary" },
  { id: "section-activity", label: "Activity Heatmap" },
  { id: "section-temporal", label: "Temporal Profile" },
  { id: "section-repositories", label: "Repositories" },
  { id: "section-distinctions", label: "Repository Awards" },
  { id: "section-languages", label: "Language DNA" },
  { id: "section-commits", label: "Commit Forensics" },
  { id: "section-churn", label: "Code Churn" },
  { id: "section-collaboration", label: "Collaboration" },
  { id: "section-classifications", label: "Gitopsy Awards" },
  { id: "section-court", label: "Courtroom" },
  { id: "section-wrapped", label: "Wrapped Recap" },
  { id: "section-data", label: "Data & Privacy" },
];

interface DossierIndexNavProps {
  onLaunchWrapped?: () => void;
}

export function DossierIndexNav({ onLaunchWrapped }: DossierIndexNavProps) {
  const [activeSection, setActiveSection] = useState<string>("section-headlines");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [headerOffset, setHeaderOffset] = useState<number>(84);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const isScrollingRef = useRef(false);

  // Dynamically compute exact header bottom boundary + 20px across all viewports and browser zoom levels
  useEffect(() => {
    const computeOffset = () => {
      const headerEl = document.querySelector("header");
      if (headerEl) {
        const rect = headerEl.getBoundingClientRect();
        setHeaderOffset(Math.round(rect.bottom + 20));
      }
    };

    computeOffset();

    window.addEventListener("resize", computeOffset);
    let observer: ResizeObserver | null = null;
    const headerEl = document.querySelector("header");
    if (headerEl && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(computeOffset);
      observer.observe(headerEl);
    }

    return () => {
      window.removeEventListener("resize", computeOffset);
      if (observer) observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const scrollContainer =
      document.getElementById("app-main-scroll") || window;

    const handleScroll = () => {
      if (isScrollingRef.current) return;

      const containerTop =
        scrollContainer === window
          ? 0
          : (scrollContainer as HTMLElement).getBoundingClientRect().top;

      let currentId = SECTIONS[0].id;

      for (let i = 0; i < SECTIONS.length; i++) {
        const el = document.getElementById(SECTIONS[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          const offset = rect.top - containerTop;
          // When section top reaches the viewing zone with clearance
          if (offset <= 140) {
            currentId = SECTIONS[i].id;
          }
        }
      }

      setActiveSection(currentId);

      // Compute scroll percentage (0% to 100%)
      const scrollTop =
        scrollContainer === window
          ? window.scrollY
          : (scrollContainer as HTMLElement).scrollTop;
      const scrollHeight =
        scrollContainer === window
          ? document.documentElement.scrollHeight
          : (scrollContainer as HTMLElement).scrollHeight;
      const clientHeight =
        scrollContainer === window
          ? window.innerHeight
          : (scrollContainer as HTMLElement).clientHeight;

      const maxScroll = scrollHeight - clientHeight;
      const progress =
        maxScroll > 0 ? Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100)) : 0;
      setScrollProgress(progress);
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Dismiss mobile floating index menu on outside tap
  useEffect(() => {
    if (!isMobileOpen) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#mobile-floating-index-container")) {
        setIsMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isMobileOpen]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      isScrollingRef.current = true;
      setActiveSection(id);
      setIsMobileOpen(false);

      const scrollContainer = document.getElementById("app-main-scroll");
      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        // Give 36px of breathing room above the box edge so outer borders and padding clear cleanly
        const targetScrollTop = scrollContainer.scrollTop + (elRect.top - containerRect.top) - 36;
        scrollContainer.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: "smooth",
        });
      } else {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      setTimeout(() => {
        isScrollingRef.current = false;
      }, 700);
    }
  };

  const scrollToTop = () => {
    const scrollContainer = document.getElementById("app-main-scroll");
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Desktop Left Column (Fixed Standalone Sidebar with Dynamic Header Offset & Scroll Isolation) */}
      <aside
        className="hidden lg:flex fixed left-4 xl:left-6 bottom-8 w-52 xl:w-60 flex-col justify-between z-30 pointer-events-auto select-none overscroll-contain"
        style={{ top: `${headerOffset}px` }}
        aria-label="Dossier Index Navigation"
        data-lenis-prevent="true"
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full justify-between">
          <div>
            {/* Console Link */}
            <Link
              href="/autopsy"
              className="relative text-xs sm:text-[13px] font-jetbrains uppercase tracking-wider text-black bg-black/[0.06] hover:bg-black/[0.12] border border-black/20 hover:border-black/40 px-3 py-2 rounded-lg flex items-center justify-center transition-all mb-3.5 group w-full font-bold"
              style={{ fontWeight: 800 }}
            >
              <ArrowLeft className="absolute left-3.5 size-4 stroke-[3] group-hover:-translate-x-0.5 transition-transform" />
              <span>CONSOLE</span>
            </Link>

            {/* Header */}
            <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-black/15">
              <span className="text-xs font-jetbrains font-bold uppercase tracking-widest text-black">
                DOSSIER INDEX
              </span>
            </div>

            {/* Section Items with Clean Subtle Background Effect */}
            <nav
              className="flex flex-col gap-1 pr-1 overflow-y-auto overscroll-contain no-scrollbar"
              style={{ maxHeight: `calc(100vh - ${headerOffset + 180}px)` }}
              data-lenis-prevent="true"
            >
              {SECTIONS.map((sec) => {
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`text-left font-jetbrains py-1.5 px-2.5 transition-all block rounded-md text-xs xl:text-[13px] ${
                      isActive
                        ? "text-black font-bold bg-black/[0.10] backdrop-blur-sm"
                        : "text-neutral-900 font-semibold hover:text-black hover:bg-black/[0.05]"
                    }`}
                  >
                    <span className="truncate block">{sec.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Actions (Launch Wrapped above divider, Scroll To Top centered below divider) */}
          <div className="pt-2 flex flex-col gap-2.5">
            {onLaunchWrapped && (
              <button
                onClick={onLaunchWrapped}
                className="w-full bg-[#FFDC58] hover:bg-[#FACC15] text-black border-2 border-black rounded-lg py-2 px-3 shadow-[2.5px_2.5px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] font-jetbrains text-xs sm:text-[13px] uppercase tracking-wider flex items-center justify-center transition-all cursor-pointer"
                style={{ fontWeight: 800 }}
              >
                <span>LAUNCH WRAPPED</span>
              </button>
            )}

            {/* Horizontal Divider Line above Scroll To Top */}
            <div className="pt-2.5 border-t-2 border-black/15 flex items-center justify-center">
              <button
                onClick={scrollToTop}
                className="text-xs font-jetbrains font-semibold uppercase tracking-wider text-black hover:text-neutral-700 flex items-center justify-center gap-1.5 py-0.5 px-1 hover:translate-y-[-1px] transition-transform w-full cursor-pointer"
                style={{ fontWeight: 600 }}
              >
                <ArrowUp className="size-3.5 stroke-[2.2]" />
                <span>SCROLL TO TOP</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Top Actions (Console Link & Wrapped Button) */}
      <div className="lg:hidden w-full flex items-center justify-between gap-3 mb-4 pt-1 pb-2 border-b-2 border-black/10">
        <Link
          href="/autopsy"
          className="text-xs font-jetbrains uppercase text-gray-800 hover:text-black flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/[0.05] hover:bg-black/[0.09] border border-black/15 transition-all font-bold"
          style={{ fontWeight: 800 }}
        >
          <ArrowLeft className="size-3.5 stroke-[3]" />
          <span>CONSOLE</span>
        </Link>

        {onLaunchWrapped && (
          <button
            onClick={onLaunchWrapped}
            className="bg-[#FFDC58] hover:bg-[#FACC15] border-2 border-black px-3.5 py-1.5 rounded-lg shadow-[2px_2px_0_0_#000] text-black font-jetbrains text-xs uppercase flex items-center gap-1.5 transition-all active:shadow-none"
            style={{ fontWeight: 800 }}
          >
            <span>LAUNCH WRAPPED</span>
          </button>
        )}
      </div>

      {/* Mobile Floating Island Dock Container — overshoots 20px past the viewport bottom
           edge so no content can ever bleed through, even with subpixel rounding. */}
      <div
        id="mobile-floating-index-container"
        className="lg:hidden fixed -bottom-5 inset-x-0 flex flex-col items-center z-40 select-none pointer-events-none bg-[#F4EFE6] px-[6px] pt-[3px] pb-[26px]"
      >
        {/* Single Morphing Pill that smoothly expands its height upwards */}
        <motion.div
          layout
          transition={{
            type: "spring",
            damping: 32,
            stiffness: 350,
            mass: 0.8,
          }}
          className="w-full max-w-lg bg-white border-[2.5px] border-black rounded-[12px] shadow-none flex flex-col pointer-events-auto overflow-hidden relative"
        >
          {/* Expanded Drawer Content (animates in/out seamlessly inside the same pill) */}
          <AnimatePresence initial={false}>
            {isMobileOpen && (
              <motion.div
                key="mobile-index-expanded-drawer"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{
                  duration: 0.28,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="overflow-hidden flex flex-col"
              >
                {/* Header inside the expanding pill */}
                <div className="flex items-center justify-between px-3.5 pt-3 pb-2 border-b-[2px] border-black/15">
                  <span className="text-xs font-jetbrains font-bold uppercase tracking-wider text-black">
                    DOSSIER INDEX
                  </span>
                  <button
                    onClick={() => setIsMobileOpen(false)}
                    className="p-1 hover:bg-black/5 rounded-[6px] border border-black/20 cursor-pointer text-black"
                    aria-label="Close index"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>

                {/* Section Items List (utilizes available vertical height) */}
                <div
                  className="flex flex-col gap-0.5 p-2 max-h-[82vh] overflow-y-auto overscroll-contain no-scrollbar"
                  data-lenis-prevent="true"
                  onWheel={(e) => e.stopPropagation()}
                >
                  {SECTIONS.map((sec) => {
                    const isActive = activeSection === sec.id;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => {
                          scrollToSection(sec.id);
                          setIsMobileOpen(false);
                        }}
                        className={`text-left text-xs font-jetbrains px-3 py-1.5 rounded-[6px] transition-all flex items-center justify-between cursor-pointer ${
                          isActive
                            ? "bg-[#FFDC58] text-black font-bold border border-black shadow-none"
                            : "text-neutral-800 hover:bg-amber-100/60 font-medium"
                        }`}
                      >
                        <span className="truncate">{sec.label}</span>
                        {isActive && <span className="text-[10px] font-bold">●</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Divider separating list from bottom bar */}
                <div className="border-t-[2px] border-black/15" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Dock Control Bar (always visible as the base 48px height) */}
          <div className="w-full h-12 flex items-center shrink-0 relative bg-white">
            {/* INDEX text — absolutely centered across the full pill width, safe from scroll indicator */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="absolute inset-0 flex items-center justify-center gap-2 pr-[86px] text-black font-jetbrains font-bold text-xs uppercase tracking-wider hover:bg-black/[0.04] active:bg-black/[0.08] transition-colors cursor-pointer z-0"
              aria-label="Toggle Dossier Index"
            >
              <span>INDEX</span>
              <ChevronUp
                className={`size-4 stroke-[2.5] transition-transform duration-300 ease-out ${
                  isMobileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Spacer to push scroll indicator to the right */}
            <div className="flex-1" />

            {/* Right Side: Circular Scroll Indicator & Percentage (above the INDEX layer) */}
            <button
              onClick={scrollToTop}
              className="w-[84px] h-full flex items-center justify-center gap-1.5 px-2 hover:bg-black/[0.04] active:bg-black/[0.08] text-black font-jetbrains font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shrink-0 relative z-10"
              title={`Scroll to top (${Math.round(scrollProgress)}% read)`}
              aria-label={`Scroll to top (${Math.round(scrollProgress)}% read)`}
            >
              <div className="relative size-7 flex items-center justify-center shrink-0">
                <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="13" className="stroke-black/20 fill-none" strokeWidth="2.5" />
                  <circle
                    cx="16"
                    cy="16"
                    r="13"
                    fill="none"
                    stroke="#FD9745"
                    strokeWidth="3"
                    strokeDasharray={81.68}
                    strokeDashoffset={81.68 - (scrollProgress / 100) * 81.68}
                    strokeLinecap="round"
                    className="transition-[stroke-dashoffset] duration-100 ease-out"
                  />
                </svg>
                <ArrowUp className="size-3.5 stroke-[3] text-black" />
              </div>
              <span className="w-[38px] text-left font-mono font-bold text-xs tabular-nums">
                {Math.round(scrollProgress)}%
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
