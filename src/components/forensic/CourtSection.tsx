"use client";

import React, { useState } from "react";
import { CourtCharge } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Scale, Gavel, ShieldAlert, CheckCircle2 } from "lucide-react";

interface CourtSectionProps {
  charges: CourtCharge[];
  defendantLogin: string;
}

export function CourtSection({ charges, defendantLogin }: CourtSectionProps) {
  const [activeChargeIndex, setActiveChargeIndex] = useState(0);
  const activeCharge = charges[activeChargeIndex] || charges[0];

  return (
    <div id="section-court" className="border-[4px] border-black bg-white rounded-[12px] p-6 shadow-[8px_8px_0_0_#000] flex flex-col gap-6 text-black">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-[3px] border-black pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="size-6 text-black" />
            <h2 className="text-xl font-black uppercase tracking-tight">
              09. GITOPSY COURTROOM: THE PEOPLE VS. {defendantLogin}
            </h2>
          </div>
          <p className="text-xs font-bold text-gray-600 mt-0.5">
            Formal forensic indictments filed on behalf of sensible sleep cycles and git history hygiene.
          </p>
        </div>

        <Badge variant="coral">DOCKET: ACTIVE TRIAL</Badge>
      </div>

      {/* Charge Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {charges.map((c, idx) => (
          <button
            key={c.id}
            onClick={() => setActiveChargeIndex(idx)}
            className={`neo-btn px-3 py-2 rounded-[6px] text-xs font-black uppercase whitespace-nowrap transition-all ${
              activeChargeIndex === idx
                ? "bg-[#FFDC58] text-black border-[2px] border-black shadow-[2px_2px_0_0_#000]"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-black/30"
            }`}
          >
            {c.chargeTitle.split(":")[0]}
          </button>
        ))}
      </div>

      {/* Active Charge Display */}
      {activeCharge && (
        <div className="border-[3px] border-black bg-[#FFFBEB] rounded-[10px] p-6 shadow-[4px_4px_0_0_#000] flex flex-col gap-5 text-black">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-[2px] border-black/15 pb-3">
            <h3 className="text-lg font-black uppercase font-mono">{activeCharge.chargeTitle}</h3>
            <span className="stamp-verdict">{activeCharge.verdict}</span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-600">
              FORMAL ALLEGATION:
            </span>
            <p className="text-sm font-bold text-gray-900 leading-relaxed bg-white p-3 rounded border border-black/20">
              &ldquo;{activeCharge.allegation}&rdquo;
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-600">
              VERIFIED METRIC EVIDENCE:
            </span>
            <div className="bg-white p-3 rounded border border-black/20 font-mono text-xs font-bold text-emerald-900 flex items-start gap-2">
              <CheckCircle2 className="size-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>{activeCharge.evidence}</span>
            </div>
          </div>

          <div className="border-t-[2px] border-black/15 pt-3 flex items-start gap-3 bg-amber-100/60 p-3 rounded border border-black/20">
            <Gavel className="size-5 text-black shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-black uppercase text-gray-600">COURT SENTENCE:</span>
              <p className="text-xs font-black text-black mt-0.5">{activeCharge.sentence}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
