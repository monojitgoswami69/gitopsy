"use client";

import React, { useState } from "react";
import { GitopsyAnalysis } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { ForensicDataSanitizer } from "@/lib/db/exportImport";
import { Download, Upload, ShieldCheck, Database } from "lucide-react";

interface DataManagementSectionProps {
  analysis: GitopsyAnalysis;
  onAnalysisUpdated: (analysis: GitopsyAnalysis) => void;
}

export function DataManagementSection({ analysis, onAnalysisUpdated }: DataManagementSectionProps) {
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleExportJson = async () => {
    try {
      const json = await ForensicDataSanitizer.exportFullAutopsyJson(analysis.id);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gitopsy-${analysis.subject.login}-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export JSON report.");
    }
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const updated = await ForensicDataSanitizer.importAutopsyJson(text);
      if (updated) {
        onAnalysisUpdated(updated);
        setImportStatus("Dossier successfully imported and verified against schema.");
      }
    } catch (err: any) {
      setImportStatus(`Import failed: ${err.message || "Invalid file"}`);
    }
  };

  return (
    <div id="section-data" className="border-[4px] border-black bg-white rounded-[12px] p-4 sm:p-6 shadow-[3.5px_3.5px_0_0_#000] flex flex-col gap-5 sm:gap-6 text-black">
      <div className="flex items-center justify-between border-b-[3px] border-black pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Database className="size-5 sm:size-6 text-black stroke-[2.2] shrink-0" />
            <h2 className="text-xl font-bold uppercase tracking-tight">
              THE EVIDENCE LOCKER
            </h2>
          </div>
          <p className="text-xs font-bold text-neutral-800 mt-1">
            Your report stays in your browser. Inspect it, export it, or clear the file when you&apos;re done.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Export Card */}
        <div className="border-[2px] border-black p-4 sm:p-5 rounded-[8px] bg-[#FFFBEB] flex flex-col justify-between gap-4 shadow-[1.5px_1.5px_0_0_#000]">
          <div className="flex flex-col gap-2">
            <h3 className="font-black text-base uppercase flex items-center gap-2">
              <Download className="size-5" /> EXPORT DOSSIER
            </h3>
            <p className="text-xs text-gray-700 font-semibold leading-relaxed">
              Download a complete, structured snapshot of all metrics, classifications, distinctions, and
              findings. All authentication tokens and secrets are guaranteed 100% redacted.
            </p>
          </div>

          <Button variant="main" size="md" className="w-full font-black shadow-[2px_2px_0_0_#000] hover:shadow-[1px_1px_0_0_#000]" onClick={handleExportJson}>
            <Download className="size-4" /> EXPORT DOSSIER
          </Button>
        </div>

        {/* Import Card */}
        <div className="border-[2px] border-black p-4 sm:p-5 rounded-[8px] bg-[#EFF6FF] flex flex-col justify-between gap-4 shadow-[1.5px_1.5px_0_0_#000]">
          <div className="flex flex-col gap-2">
            <h3 className="font-black text-base uppercase flex items-center gap-2">
              <Upload className="size-5" /> IMPORT DOSSIER
            </h3>
            <p className="text-xs text-gray-700 font-semibold leading-relaxed">
              Upload a previously exported Gitopsy file. The report will be verified and loaded into
              your local browser session.
            </p>
          </div>

          <label className="cursor-pointer block w-full">
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            <div className="w-full h-11 px-5 inline-flex items-center justify-center font-black tracking-wide uppercase transition-all duration-100 cursor-pointer select-none rounded-[6px] bg-[#4D96FF] hover:bg-[#6ba6ff] text-black border-[2px] border-black shadow-[2px_2px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none gap-2 text-sm">
              <Upload className="size-4" /> IMPORT DOSSIER
            </div>
          </label>
        </div>
      </div>

      {importStatus && (
        <div className="border-[2px] border-black bg-amber-100 p-3 rounded-[6px] text-xs font-mono font-bold shadow-[1.5px_1.5px_0_0_#000]">
          {importStatus}
        </div>
      )}
    </div>
  );
}
