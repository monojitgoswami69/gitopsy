"use client";


export function ForensicWatermark() {
  return (
    <div
      className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden w-full h-full"
      aria-hidden="true"
    >
      {/* SVG Distress / Rubber Stamp Ink Displacement Filter */}
      <svg className="absolute size-0">
        <defs>
          <filter id="rubber-stamp-grunge" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="distorted" />
            <feMerge>
              <feMergeNode in="distorted" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* ---------------- STAMP 1: TOP-LEFT CIRCULAR NOTARY SEAL (Prussian Blue) ---------------- */}
      <div
        className="absolute top-[5%] left-[4%] sm:left-[6%] -rotate-12 opacity-[0.08] mix-blend-multiply transform-gpu"
        style={{ filter: "url(#rubber-stamp-grunge)" }}
      >
        <div className="size-40 sm:size-48 rounded-full border-[3px] border-[#1E3A8A] p-1.5 flex items-center justify-center text-[#1E3A8A] font-mono">
          <div className="w-full h-full rounded-full border border-dashed border-[#1E3A8A] p-2 flex flex-col items-center justify-center text-center relative">
            <svg viewBox="0 0 160 160" className="absolute inset-0 w-full h-full stroke-none fill-[#1E3A8A]">
              <path
                id="stamp-seal-path-1"
                d="M 80, 80 m -60, 0 a 60,60 0 1,1 120,0 a 60,60 0 1,1 -120,0"
                fill="none"
              />
              <text className="text-[7.2px] font-black uppercase tracking-[0.22em]">
                <textPath href="#stamp-seal-path-1" startOffset="0%">
                  ★ BUREAU OF GITHUB FORENSICS ★ OFFICIAL SEAL ★
                </textPath>
              </text>
            </svg>
            <div className="text-[7.5px] font-black tracking-[0.2em] uppercase text-[#1E3A8A] mb-0.5">
              OFFICIAL AUDIT
            </div>
            <div className="text-xs font-black tracking-widest border-y border-[#1E3A8A] py-0.5 px-2 uppercase">
              EXHIBIT A
            </div>
            <div className="text-[6.5px] font-bold tracking-wider uppercase text-[#1E3A8A] mt-0.5">
              NO CLOUD TELEMETRY
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- STAMP 2: TOP-RIGHT RECTANGULAR EXAMINATION (Crimson) ---------------- */}
      <div
        className="absolute top-[6%] right-[6%] sm:right-[10%] rotate-6 opacity-[0.085] mix-blend-multiply transform-gpu"
        style={{ filter: "url(#rubber-stamp-grunge)" }}
      >
        <div className="border-[3px] border-[#B91C1C] rounded-lg p-1 text-[#B91C1C] font-mono">
          <div className="border border-dashed border-[#B91C1C] p-2.5 flex flex-col items-center justify-center text-center">
            <div className="text-[8px] font-black tracking-[0.22em] border-b border-[#B91C1C]/80 pb-0.5 uppercase w-full">
              DEPARTMENT OF CODE PATHOLOGY
            </div>
            <div className="text-xs sm:text-sm font-black tracking-widest my-1 border-y-2 border-[#B91C1C] py-0.5 px-3 uppercase bg-[#B91C1C]/5">
              EXAMINED &amp; FILED
            </div>
            <div className="flex items-center justify-between w-full text-[7px] font-bold tracking-wider pt-0.5 gap-3">
              <span>REF: GTY-2026</span>
              <span>•</span>
              <span>100% IN-BROWSER</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- STAMP 3: UPPER-CENTER INSPECTION MARK (Muted Burgundy) ---------------- */}
      <div
        className="absolute top-[16%] left-[42%] rotate-4 opacity-[0.07] mix-blend-multiply transform-gpu hidden lg:block"
        style={{ filter: "url(#rubber-stamp-grunge)" }}
      >
        <div className="border-2 border-dashed border-[#991B1B] rounded-lg px-4 py-1.5 text-[#991B1B] font-mono text-center flex flex-col items-center">
          <span className="text-[7.5px] font-black tracking-[0.25em] uppercase">OFFICIAL GITHUB ARTIFACT</span>
          <span className="text-[10px] font-black tracking-wider uppercase my-0.5 text-[#991B1B]">
            AUTHENTICATED SPECIMEN
          </span>
        </div>
      </div>

      {/* ---------------- STAMP 4: UPPER-MID LEFT DIAMOND NOTARY (Cobalt Blue) ---------------- */}
      <div
        className="absolute top-[26%] left-[16%] rotate-12 opacity-[0.075] mix-blend-multiply transform-gpu hidden md:block"
        style={{ filter: "url(#rubber-stamp-grunge)" }}
      >
        <div className="size-24 border-2 border-dashed border-[#1D4ED8] p-2 flex flex-col items-center justify-center text-center text-[#1D4ED8] font-mono rotate-45">
          <div className="-rotate-45 flex flex-col items-center">
            <span className="text-[7px] font-black tracking-wider uppercase">IMMUTABLE</span>
            <span className="text-[10px] font-black uppercase tracking-widest my-0.5 border-y border-[#1D4ED8] px-1">
              RECORD
            </span>
            <span className="text-[6.5px] font-extrabold uppercase">100% IN-BROWSER</span>
          </div>
        </div>
      </div>

      {/* ---------------- STAMP 5: UPPER-MID RIGHT OVAL SEAL (Burgundy Red) ---------------- */}
      <div
        className="absolute top-[28%] right-[5%] sm:right-[8%] -rotate-8 opacity-[0.08] mix-blend-multiply transform-gpu"
        style={{ filter: "url(#rubber-stamp-grunge)" }}
      >
        <div className="w-48 sm:w-56 h-24 sm:h-28 border-[3px] border-[#991B1B] rounded-[100%] p-1 flex items-center justify-center text-[#991B1B] font-mono">
          <div className="w-full h-full border border-dashed border-[#991B1B] rounded-[100%] flex flex-col items-center justify-center text-center p-2">
            <span className="text-[7.5px] font-black uppercase tracking-[0.2em]">
              OFFICIAL AUTOPSY DOSSIER
            </span>
            <span className="text-xs font-black tracking-widest my-0.5 border-y border-[#991B1B] px-3 uppercase bg-[#991B1B]/5">
              SPECIMEN INTAKE
            </span>
            <span className="text-[6.5px] font-bold tracking-wider uppercase">
              LOCAL CLIENT RECORD • FORM 804
            </span>
          </div>
        </div>
      </div>

      {/* ---------------- STAMP 6: CENTER-LEFT OCTAGONAL INSPECTION (Deep Navy) ---------------- */}
      <div
        className="absolute top-[46%] left-[4%] sm:left-[8%] -rotate-6 opacity-[0.08] mix-blend-multiply transform-gpu"
        style={{ filter: "url(#rubber-stamp-grunge)" }}
      >
        <div className="size-36 sm:size-40 border-[3px] border-[#1E40AF] rounded-2xl p-2 flex flex-col items-center justify-center text-center text-[#1E40AF] font-mono">
          <div className="w-full h-full border border-dashed border-[#1E40AF] rounded-xl flex flex-col items-center justify-center p-1.5">
            <span className="text-[7.5px] font-black uppercase tracking-widest text-[#1E40AF]">
              CLINICAL CLEARANCE
            </span>
            <span className="text-xs font-black tracking-wider uppercase my-0.5 border-y border-[#1E40AF] px-2 py-0.5 bg-[#1E40AF]/5">
              PASSED AUDIT
            </span>
            <span className="text-[6.5px] font-bold uppercase tracking-wider text-[#1E40AF]/90">
              HASH: 0x2026-GTY • SECURE
            </span>
          </div>
        </div>
      </div>

      {/* ---------------- STAMP 7: CENTER-RIGHT DATER STAMP (Crimson Red) ---------------- */}
      <div
        className="absolute top-[48%] right-[16%] rotate-7 opacity-[0.085] mix-blend-multiply transform-gpu"
        style={{ filter: "url(#rubber-stamp-grunge)" }}
      >
        <div className="border-2 border-[#B91C1C] rounded px-3.5 py-1.5 text-[#B91C1C] font-mono text-center flex flex-col items-center bg-[#B91C1C]/5">
          <span className="text-[7.5px] font-black tracking-widest uppercase">
            CASE DOSSIER INTAKE
          </span>
          <span className="text-xs sm:text-sm font-black tracking-widest my-0.5 border-y border-[#B91C1C] px-2.5 py-0.5">
            21 AUG 2026
          </span>
          <span className="text-[6.5px] font-bold tracking-wider uppercase text-[#B91C1C]/90">
            LOCAL IN-BROWSER AUDIT
          </span>
        </div>
      </div>

      {/* ---------------- STAMP 8: LOWER-MID CENTER ARCHED BADGE (Crimson) ---------------- */}
      <div
        className="absolute top-[64%] left-[22%] -rotate-3 opacity-[0.075] mix-blend-multiply transform-gpu hidden sm:block"
        style={{ filter: "url(#rubber-stamp-grunge)" }}
      >
        <div className="border-2 border-[#B91C1C] rounded-full px-5 py-1 text-[#B91C1C] font-mono flex items-center gap-2 bg-[#B91C1C]/5">
          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.22em]">
            ★ AUTOPSY ARCHIVE RECORD • CASE FILED ★
          </span>
        </div>
      </div>

      {/* ---------------- STAMP 9: LOWER-MID RIGHT DOCKET SEAL (Prussian Blue) ---------------- */}
      <div
        className="absolute top-[66%] right-[6%] sm:right-[10%] rotate-9 opacity-[0.08] mix-blend-multiply transform-gpu"
        style={{ filter: "url(#rubber-stamp-grunge)" }}
      >
        <div className="size-36 sm:size-42 rounded-full border-[3px] border-[#1E3A8A] p-1.5 flex items-center justify-center text-[#1E3A8A] font-mono">
          <div className="w-full h-full rounded-full border border-dashed border-[#1E3A8A] p-2 flex flex-col items-center justify-center text-center">
            <span className="text-[7px] font-black uppercase tracking-widest text-[#1E3A8A]/80">
              AUDIT COMPLETED
            </span>
            <span className="text-xs font-black border-y border-[#1E3A8A] py-0.5 px-2 my-0.5 tracking-widest uppercase">
              SEALED DOSSIER
            </span>
            <span className="text-[6.5px] font-extrabold uppercase text-[#1E3A8A]/80">
              ZERO CLOUD TELEMETRY
            </span>
          </div>
        </div>
      </div>

      {/* ---------------- STAMP 10: BOTTOM-LEFT DISPOSITION BOX (Crimson) ---------------- */}
      <div
        className="absolute bottom-[6%] left-[6%] sm:left-[10%] -rotate-9 opacity-[0.08] mix-blend-multiply transform-gpu"
        style={{ filter: "url(#rubber-stamp-grunge)" }}
      >
        <div className="border-[3px] border-dashed border-[#B91C1C] rounded-lg p-2.5 text-[#B91C1C] font-mono text-center flex flex-col items-center">
          <span className="text-[7.5px] font-black uppercase tracking-[0.2em]">FINAL DISPOSITION</span>
          <span className="text-xs font-black tracking-widest uppercase my-0.5 border-y border-[#B91C1C] px-2 py-0.5 bg-[#B91C1C]/5">
            FILED TO DATABASE
          </span>
          <span className="text-[6.5px] font-bold uppercase tracking-wider">LOCAL INDEXEDDB STORAGE</span>
        </div>
      </div>

      {/* ---------------- STAMP 11: BOTTOM-RIGHT CIRCULAR SEAL (Cobalt Blue) ---------------- */}
      <div
        className="absolute bottom-[8%] right-[8%] sm:right-[14%] rotate-11 opacity-[0.08] mix-blend-multiply transform-gpu"
        style={{ filter: "url(#rubber-stamp-grunge)" }}
      >
        <div className="size-36 sm:size-40 rounded-full border-[3px] border-[#1D4ED8] p-1.5 flex items-center justify-center text-[#1D4ED8] font-mono">
          <div className="w-full h-full rounded-full border border-dashed border-[#1D4ED8] p-2 flex flex-col items-center justify-center text-center">
            <span className="text-[7px] font-black uppercase tracking-widest text-[#1D4ED8]">
              ★ SECURE CLIENT RUN ★
            </span>
            <span className="text-xs font-black uppercase my-0.5 border-y border-[#1D4ED8] px-2">
              AUDITED 2026
            </span>
            <span className="text-[6.5px] font-bold uppercase text-[#1D4ED8]/90">
              IMMUTABLE RECORD
            </span>
          </div>
        </div>
      </div>

      {/* ---------------- STAMP 12: BOTTOM-CENTER MARGIN CODEX (Navy Blue) ---------------- */}
      <div
        className="absolute bottom-[4%] left-[40%] -rotate-2 opacity-[0.07] mix-blend-multiply transform-gpu hidden lg:block"
        style={{ filter: "url(#rubber-stamp-grunge)" }}
      >
        <div className="border border-dashed border-[#1E40AF] px-4 py-1 text-[#1E40AF] font-mono text-[8px] font-bold uppercase tracking-[0.25em]">
          DOCKET CLASSIFICATION: OFFICIAL GITHUB AUTOPSY REPORT • CONFIDENTIAL
        </div>
      </div>
    </div>
  );
}
