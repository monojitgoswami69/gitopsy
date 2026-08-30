"use client";

import { DeveloperClassification } from "@/types/domain";
import { Trophy, CheckCircle2 } from "lucide-react";

interface ClassificationsSectionProps {
  classifications: DeveloperClassification[];
}

export function ClassificationsSection({ classifications }: ClassificationsSectionProps) {
  // Only display derived/satisfied behavioral awards
  const derivedAwards = classifications.filter((arch) =>
    arch.evidence.every((e) => e.isSatisfied)
  );

  if (derivedAwards.length === 0) {
    return null;
  }

  return (
    <div id="section-classifications" className="border-[4px] border-black bg-white rounded-[12px] p-4 sm:p-6 shadow-[3.5px_3.5px_0_0_#000] flex flex-col gap-5 sm:gap-6 text-black">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-[3px] border-black pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Trophy className="size-5 sm:size-6 text-black stroke-[2.2] shrink-0" />
            <h2 className="text-xl font-bold uppercase tracking-tight text-black">
              YOUR GITOPSY FINDINGS
            </h2>
          </div>
          <p className="text-xs font-bold text-neutral-800 mt-1">
            Patterns emerged. We gave them names.
          </p>
        </div>
      </div>

      {/* In-Box Grid Cards with Minimal Drop Shadows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {derivedAwards.map((arch) => (
          <div
            key={arch.id}
            className="border-[2px] border-black bg-[#FFFBEB] rounded-[8px] p-4 sm:p-5 shadow-[1.5px_1.5px_0_0_#000] flex flex-col justify-between gap-4 text-black hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0_0_#000] transition-all"
          >
            {/* Top Row: Title */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div
                  className="text-sm sm:text-base font-black uppercase px-2.5 py-1 border-[1.5px] border-black rounded shadow-[1px_1px_0_0_#000]"
                  style={{ backgroundColor: arch.badgeAccent || "#FFDC58" }}
                >
                  {arch.title}
                </div>
              </div>

              <p className="text-xs font-bold text-gray-800 italic mt-1">&ldquo;{arch.tagline}&rdquo;</p>
              <p className="text-xs font-semibold text-gray-700 leading-relaxed">{arch.description}</p>
            </div>

            {/* Evidence Checklist Drawer */}
            <div className="border-t-[1.5px] border-black/15 pt-3 flex flex-col gap-1.5 bg-white p-3 sm:p-3.5 rounded-[6px] border border-black/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-600 mb-0.5">
                OBSERVED EVIDENCE:
              </span>
              {arch.evidence.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col xs:flex-row xs:items-start justify-between gap-1 xs:gap-3 text-xs font-bold py-1 border-b border-black/5 last:border-b-0"
                >
                  <div className="flex items-start gap-1.5 flex-1 min-w-0">
                    <CheckCircle2 className="size-3.5 text-emerald-700 shrink-0 mt-0.5" />
                    <span className="text-black leading-snug">
                      {item.criterion}
                    </span>
                  </div>

                  <div className="font-mono text-[11px] text-left xs:text-right pl-5 xs:pl-0 shrink-0 flex items-baseline gap-1.5 xs:block">
                    <span className="text-emerald-800 font-black">
                      {item.actualValue}
                    </span>
                    <span className="text-gray-500 font-semibold text-[10px]">
                      {" "}({item.threshold})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
