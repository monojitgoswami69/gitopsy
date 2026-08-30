"use client";

import { CourtCharge } from "@/types/domain";
import { Scale, Gavel, CheckCircle2 } from "lucide-react";

interface CourtSectionProps {
  charges: CourtCharge[];
  defendantLogin: string;
}

export function CourtSection({ charges, defendantLogin }: CourtSectionProps) {
  return (
    <div id="section-court" className="border-[4px] border-black bg-white rounded-[12px] p-4 sm:p-6 shadow-[3.5px_3.5px_0_0_#000] flex flex-col gap-5 sm:gap-6 text-black">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-[3px] border-black pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Scale className="size-5 sm:size-6 text-black stroke-[2.2] shrink-0" />
            <h2 className="text-xl font-bold uppercase tracking-tight">
              THE GITOPSY COURTROOM
            </h2>
          </div>
          <p className="text-xs font-bold text-neutral-800 mt-1">
            The evidence has been presented. The court is now in session.
          </p>
        </div>
      </div>

      {/* Direct Grid Display of All Charges (No Tabs) */}
      <div className={`grid grid-cols-1 ${charges.length > 1 ? "md:grid-cols-2" : ""} gap-4 sm:gap-5`}>
        {charges.map((charge) => (
          <div
            key={charge.id}
            className="border-[2px] border-black bg-[#FFFBEB] rounded-[8px] p-4 sm:p-5 shadow-[1.5px_1.5px_0_0_#000] flex flex-col justify-between gap-4 text-black hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0_0_#000] transition-all"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3 border-b-[2px] border-black/15 pb-2.5">
                <h3 className="text-base font-black uppercase font-mono text-black leading-tight">
                  {charge.chargeTitle}
                </h3>
                <span className="stamp-verdict text-[11px] shrink-0">{charge.verdict}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-wider text-gray-500">
                  ALLEGATION:
                </span>
                <p className="text-xs font-bold text-gray-900 leading-relaxed bg-white p-3 rounded-[6px] border-[1.5px] border-black/30">
                  &ldquo;{charge.allegation}&rdquo;
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-wider text-gray-500">
                  EVIDENCE:
                </span>
                <div className="bg-white p-3 rounded-[6px] border-[1.5px] border-black/30 font-mono text-xs font-bold text-emerald-900 flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span className="leading-snug">{charge.evidence}</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-amber-100/70 p-3 rounded-[6px] border-[1.5px] border-black">
              <Gavel className="size-4 text-black shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-700 leading-none">
                  COURT SENTENCE:
                </span>
                <p className="text-xs font-black text-black leading-snug">{charge.sentence}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
