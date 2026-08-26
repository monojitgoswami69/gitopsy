"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUp, List, ChevronRight } from "lucide-react";

interface SectionItem {
  id: string;
  label: string;
}

const SECTIONS: SectionItem[] = [
  { id: "section-subject", label: "01. Subject Dossier" },
  { id: "section-headlines", label: "02. Case Summary" },
  { id: "section-activity", label: "03. Activity Heatmap" },
  { id: "section-temporal", label: "04. Temporal Profile" },
  { id: "section-repositories", label: "05. Repositories" },
  { id: "section-distinctions", label: "06. Distinctions" },
  { id: "section-languages", label: "07. Language DNA" },
  { id: "section-commits", label: "08. Commit Forensics" },
  { id: "section-churn", label: "09. Monthly Churn" },
  { id: "section-collaboration", label: "10. Collaboration" },
  { id: "section-classifications", label: "11. Assessments" },
  { id: "section-findings", label: "12. Findings" },
  { id: "section-court", label: "13. Courtroom" },
  { id: "section-case-notes", label: "14. Case Notes" },
  { id: "section-wrapped", label: "15. Wrapped Recap" },
  { id: "section-data", label: "16. Data & Privacy" },
];

interface DossierIndexNavProps {
  onLaunchWrapped?: () => void;
}

export function DossierIndexNav({ onLaunchWrapped }: DossierIndexNavProps) {
  const [activeSection, setActiveSection] = useState<string>("section-headlines");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [headerOffset, setHeaderOffset] = useState<number>(84);
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
          // When section top reaches the viewing zone
          if (offset <= 220) {
            currentId = SECTIONS[i].id;
          }
        }
      }

      setActiveSection(currentId);
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      isScrollingRef.current = true;
      setActiveSection(id);
      setIsMobileOpen(false);

      el.scrollIntoView({ behavior: "smooth", block: "start" });

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

      {/* Mobile / Tablet Collapsible Sticky Bar */}
      <div className="lg:hidden w-full sticky top-0 z-30 bg-[#F4EFE6]/95 backdrop-blur-md border-b-2 border-black py-2 mb-4">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/autopsy"
            className="text-xs font-mono font-black uppercase text-gray-700 hover:text-black flex items-center gap-1 shrink-0 px-2 py-1"
          >
            <ArrowLeft className="size-3.5 stroke-[2.5]" />
            <span>CONSOLE</span>
          </Link>

          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="flex-1 bg-white border-2 border-black rounded-lg px-3 py-1.5 shadow-[2px_2px_0_0_#000] flex items-center justify-between text-xs font-mono font-bold text-black"
          >
            <span className="flex items-center gap-1.5 truncate">
              <List className="size-3.5 shrink-0" />
              <span className="truncate">INDEX: {SECTIONS.find((s) => s.id === activeSection)?.label || "01. Subject Dossier"}</span>
            </span>
            <ChevronRight className={`size-3.5 shrink-0 transition-transform ${isMobileOpen ? "rotate-90" : ""}`} />
          </button>

          {onLaunchWrapped && (
            <button
              onClick={onLaunchWrapped}
              className="bg-[#FFDC58] border-2 border-black px-2.5 py-1.5 rounded-lg shadow-[2px_2px_0_0_#000] text-black font-black text-xs shrink-0"
            >
              <span>WRAPPED</span>
            </button>
          )}

          <button
            onClick={scrollToTop}
            className="bg-white border-2 border-black p-1.5 rounded-lg shadow-[2px_2px_0_0_#000] text-black shrink-0"
            title="Scroll to top"
            aria-label="Scroll to top"
          >
            <ArrowUp className="size-3.5 stroke-[2.5]" />
          </button>
        </div>

        {isMobileOpen && (
          <div
            className="bg-white border-2 border-black rounded-lg p-2 shadow-[4px_4px_0_0_#000] mt-2 flex flex-col gap-1 max-h-60 overflow-y-auto overscroll-contain"
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
          >
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`text-left text-xs font-mono px-2 py-1.5 rounded ${
                  activeSection === sec.id
                    ? "bg-[#FFDC58] font-black text-black border border-black"
                    : "text-gray-700 hover:bg-amber-50 font-bold"
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
