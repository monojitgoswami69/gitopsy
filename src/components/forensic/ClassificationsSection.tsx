"use client";

import React from "react";
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
    <div id="section-classifications" className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Trophy className="size-6 text-black" />
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-black uppercase tracking-tight text-black">
              10. THE GITOPSY AWARDS
            </h2>
          </div>
          <p className="text-xs font-bold text-gray-600 mt-0.5">
            Evidence-based behavioral patterns derived strictly from verified timestamps, churn ratios, and repository distributions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {derivedAwards.map((arch) => (
          <div
            key={arch.id}
            className="border-[4px] border-black bg-white rounded-[10px] sm:rounded-[12px] p-4 sm:p-6 shadow-[3.5px_3.5px_0_0_#000] flex flex-col justify-between gap-4 sm:gap-5 hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-[2px_2px_0_0_#000] active:translate-x-[3.5px] active:translate-y-[3.5px] active:shadow-none transition-all duration-150"
          >
            {/* Top Row: Title */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div
                  className="text-sm sm:text-base font-black uppercase px-2.5 py-1 border-[2px] border-black rounded"
                  style={{ backgroundColor: arch.badgeAccent || "#FFDC58" }}
                >
                  {arch.title}
                </div>
              </div>

              <p className="text-xs font-bold text-gray-800 italic mt-1">&ldquo;{arch.tagline}&rdquo;</p>
              <p className="text-xs font-semibold text-gray-600 leading-relaxed">{arch.description}</p>
            </div>

            {/* Evidence Checklist Drawer */}
            <div className="border-t-[2px] border-black/15 pt-3 flex flex-col gap-2 bg-amber-50/60 p-3 rounded-[6px] border border-black/10">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-600">
                OBSERVED EVIDENCE:
              </span>

              {arch.evidence.map((item, idx) => (
                <div key={idx} className="flex items-start justify-between gap-2 text-xs font-bold">
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span className="text-black">
                      {item.criterion}
                    </span>
                  </div>

                  <div className="font-mono text-[11px] shrink-0 text-right">
                    <span className="text-emerald-800 font-black">
                      {item.actualValue}
                    </span>{" "}
                    <span className="text-gray-400">({item.threshold})</span>
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
