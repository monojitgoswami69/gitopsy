"use client";

import React, { useState, useEffect } from "react";
import { List, X, ArrowUp } from "lucide-react";

interface SectionItem {
  id: string;
  label: string;
}

const SECTIONS: SectionItem[] = [
  { id: "section-headlines", label: "01. Executive Metrics" },
  { id: "section-activity", label: "02. Contribution Heatmap" },
  { id: "section-temporal", label: "03. Temporal Forensics" },
  { id: "section-repositories", label: "04. Repositories & Awards" },
  { id: "section-languages", label: "05. Language DNA" },
  { id: "section-commits", label: "06. Commit Forensics" },
  { id: "section-churn", label: "07. Monthly Code Churn" },
  { id: "section-classifications", label: "08. Classifications" },
  { id: "section-court", label: "09. Gitopsy Courtroom" },
  { id: "section-findings", label: "10. Findings & Easter Eggs" },
  { id: "section-wrapped", label: "11. Wrapped Recap" },
  { id: "section-data", label: "12. Export & Storage" },
];

export function FloatingIndexNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("section-subject");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTIONS[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(SECTIONS[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setIsOpen(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {isOpen && (
        <div className="bg-white border-[3px] border-black rounded-[10px] p-3 shadow-[6px_6px_0_0_#000] w-64 flex flex-col gap-1 max-h-[70vh] overflow-y-auto mb-2">
          <div className="flex items-center justify-between border-b-[2px] border-black pb-2 mb-1">
            <span className="text-xs font-black uppercase tracking-wider text-black">DOSSIER INDEX</span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded border border-black/20"
              aria-label="Close index"
            >
              <X className="size-3.5" />
            </button>
          </div>
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              onClick={() => scrollToSection(sec.id)}
              className={`text-left text-xs font-bold px-2 py-1.5 rounded transition-all flex items-center justify-between ${
                activeSection === sec.id
                  ? "bg-[#FFDC58] text-black font-black border border-black shadow-[2px_2px_0_0_#000]"
                  : "text-gray-700 hover:bg-amber-50"
              }`}
            >
              <span className="truncate">{sec.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={scrollToTop}
          className="neo-btn bg-white text-black p-3 rounded-full border-[3px] border-black shadow-[3px_3px_0_0_#000] hover:bg-amber-50 transition-all"
          title="Scroll to top"
          aria-label="Scroll to top"
        >
          <ArrowUp className="size-4" />
        </button>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="neo-btn bg-[#FFDC58] text-black px-4 py-2.5 rounded-[8px] border-[3px] border-black shadow-[4px_4px_0_0_#000] flex items-center gap-2 font-black text-xs uppercase tracking-wide hover:bg-[#FD9745] transition-all"
          aria-label="Toggle Table of Contents"
        >
          <List className="size-4" />
          <span>INDEX</span>
        </button>
      </div>
    </div>
  );
}
