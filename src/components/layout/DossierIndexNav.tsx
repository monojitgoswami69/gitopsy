"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUp, List, ChevronRight, X } from "lucide-react";

interface SectionItem {
  id: string;
  label: string;
}

const SECTIONS: SectionItem[] = [
  { id: "section-headlines", label: "01. Case Summary" },
  { id: "section-activity", label: "02. Activity Heatmap" },
  { id: "section-temporal", label: "03. Temporal Profile" },
  { id: "section-repositories", label: "04. Repositories" },
  { id: "section-distinctions", label: "05. Repository Awards" },
  { id: "section-languages", label: "06. Language DNA" },
  { id: "section-commits", label: "07. Commit Forensics" },
  { id: "section-churn", label: "08. Code Churn" },
  { id: "section-collaboration", label: "09. Collaboration" },
  { id: "section-classifications", label: "10. Gitopsy Awards" },
  { id: "section-court", label: "11. Courtroom" },
  { id: "section-case-notes", label: "12. Special Notes" },
  { id: "section-wrapped", label: "13. Wrapped Recap" },
  { id: "section-data", label: "14. Data & Privacy" },
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
            {/* Back to Console Link */}
            <Link
              href="/autopsy"
              className="text-xs sm:text-[13px] font-mono font-black uppercase tracking-wider text-black bg-black/[0.04] hover:bg-black/[0.08] border border-black/15 hover:border-black/30 px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all mb-3.5 group w-full"
            >
              <ArrowLeft className="size-4 stroke-[3] group-hover:-translate-x-0.5 transition-transform" />
              <span>BACK TO CONSOLE</span>
            </Link>

            {/* Header */}
            <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-black/15">
              <span className="text-xs font-mono font-black uppercase tracking-widest text-black">
                DOSSIER INDEX
              </span>
            </div>

            {/* Section Items with Clean Color Indicator */}
            <nav
              className="flex flex-col gap-1 pr-1 overflow-y-auto overscroll-contain"
              style={{ maxHeight: `calc(100vh - ${headerOffset + 180}px)` }}
              data-lenis-prevent="true"
            >
              {SECTIONS.map((sec) => {
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`text-left font-mono py-1.5 px-2.5 transition-all block rounded-md text-xs xl:text-[13px] ${
                      isActive
                        ? "text-black font-black bg-black/[0.08]"
                        : "text-gray-500 font-bold hover:text-black hover:bg-black/[0.03]"
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
                className="w-full bg-[#FFDC58] hover:bg-[#FACC15] text-black border-2 border-black rounded-lg py-2 px-3 shadow-[2.5px_2.5px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] font-black text-xs uppercase flex items-center justify-center transition-all active:shadow-[1px_1px_0_0_#000]"
              >
                <span>LAUNCH WRAPPED</span>
              </button>
            )}

            {/* Horizontal Divider Line above Scroll To Top */}
            <div className="pt-2.5 border-t-2 border-black/15 flex items-center justify-center">
              <button
                onClick={scrollToTop}
                className="text-xs font-mono font-bold text-gray-600 hover:text-black flex items-center justify-center gap-1.5 py-0.5 px-1 hover:translate-y-[-1px] transition-transform w-full"
              >
                <ArrowUp className="size-3.5 stroke-[2.5]" />
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
          className="text-xs font-mono font-black uppercase text-gray-800 hover:text-black flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/[0.05] hover:bg-black/[0.09] border border-black/15 transition-all"
        >
          <ArrowLeft className="size-3.5 stroke-[2.5]" />
          <span>CONSOLE</span>
        </Link>

        {onLaunchWrapped && (
          <button
            onClick={onLaunchWrapped}
            className="bg-[#FFDC58] hover:bg-[#FACC15] border-2 border-black px-3.5 py-1.5 rounded-lg shadow-[2px_2px_0_0_#000] text-black font-black text-xs uppercase flex items-center gap-1.5 transition-all active:shadow-none"
          >
            <span>LAUNCH WRAPPED</span>
          </button>
        )}
      </div>

      {/* Mobile Floating Index (Bottom Left) */}
      <div
        id="mobile-floating-index-container"
        className="lg:hidden fixed bottom-4 left-6 sm:left-8 z-40 flex flex-col items-start gap-2 select-none"
      >
        {isMobileOpen && (
          <div
            className="bg-white border-[2.5px] border-black rounded-[8px] p-2.5 shadow-none w-64 sm:w-72 flex flex-col gap-1 max-h-[60vh] overflow-y-auto overscroll-contain mb-2 text-black animate-in fade-in slide-in-from-bottom-2 duration-150"
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b-[2px] border-black pb-2 mb-1">
              <span className="text-xs font-mono font-black uppercase tracking-wider text-black">
                DOSSIER INDEX
              </span>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1 hover:bg-gray-100 rounded border border-black/20"
                aria-label="Close index"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {SECTIONS.map((sec) => {
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className={`text-left text-xs font-mono px-2.5 py-1.5 rounded transition-all flex items-center justify-between ${
                    isActive
                      ? "bg-[#FFDC58] text-black font-black border border-black shadow-none"
                      : "text-gray-700 hover:bg-amber-50 font-bold"
                  }`}
                >
                  <span className="truncate">{sec.label}</span>
                </button>
              );
            })}
          </div>
        )}

        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="h-11 px-4.5 rounded-[6px] border-[2.5px] border-black bg-white text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-amber-50 active:bg-gray-100 transition-colors shadow-none cursor-pointer"
          aria-label="Toggle Dossier Index"
        >
          <List className="size-4 stroke-[2.5]" />
          <span>INDEX</span>
        </button>
      </div>

      {/* Mobile Floating Go To Top (Bottom Right) with Circular Progress Ring */}
      <div className="lg:hidden fixed bottom-4 right-6 sm:right-8 z-40 select-none">
        <button
          onClick={scrollToTop}
          className="relative size-12 rounded-full flex items-center justify-center cursor-pointer shadow-none group hover:scale-105 active:scale-95 transition-transform"
          title={`Scroll to top (${Math.round(scrollProgress)}% read)`}
          aria-label={`Scroll to top (${Math.round(scrollProgress)}% read)`}
        >
          <svg className="absolute inset-0 size-full -rotate-90 pointer-events-none" viewBox="0 0 48 48">
            {/* Background circle fill with black border */}
            <circle
              cx="24"
              cy="24"
              r="20"
              className="fill-white stroke-black"
              strokeWidth="2.5"
            />
            {/* Dynamic Active Progress Ring */}
            <circle
              cx="24"
              cy="24"
              r="16.5"
              fill="none"
              stroke="#FD9745"
              strokeWidth="3.5"
              strokeDasharray={103.67}
              strokeDashoffset={103.67 - (scrollProgress / 100) * 103.67}
              strokeLinecap="round"
              className="transition-[stroke-dashoffset] duration-100 ease-out"
            />
          </svg>
          <ArrowUp className="size-4 stroke-[3] text-black relative z-10 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>
    </>
  );
}
