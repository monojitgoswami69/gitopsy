"use client";

import React, { useState } from "react";
import { GitopsyAnalysis } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { ForensicDataSanitizer } from "@/lib/db/exportImport";
import { Download, Upload, Trash2, ShieldCheck, AlertTriangle } from "lucide-react";

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
      a.download = `gitopsy-dossier-${analysis.subject.login}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export error: ${err}`);
    }
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const report = await ForensicDataSanitizer.importAutopsyJson(text);
      onAnalysisUpdated(report);
      setImportStatus("Dossier successfully imported and verified against schema.");
    } catch (err) {
      setImportStatus(`Import validation error: ${err}`);
    }
  };

  const handlePurgeAll = async () => {
    if (confirm("Are you sure you want to permanently incinerate all local records and cached specimens?")) {
      await ForensicDataSanitizer.purgeAllForensicData();
      alert("All local data incinerated.");
      window.location.href = "/";
    }
  };

  return (
    <div id="section-data" className="border-[4px] border-black bg-white rounded-[12px] p-6 shadow-[8px_8px_0_0_#000] flex flex-col gap-6 text-black">
      <div className="flex items-center justify-between border-b-[3px] border-black pb-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight">
            12. LOCAL STORAGE & DATA MANAGEMENT
          </h2>
          <p className="text-xs font-bold text-gray-600">
            Control your in-browser Dexie IndexedDB records. 100% token-redacted exports.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="border-[3px] border-black p-5 rounded-[8px] bg-[#FFFBEB] flex flex-col justify-between gap-4 shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-150">
          <div className="flex flex-col gap-2">
            <h3 className="font-black text-base uppercase flex items-center gap-2">
              <Download className="size-5" /> EXPORT DOSSIER (JSON)
            </h3>
            <p className="text-xs text-gray-700 font-semibold leading-relaxed">
              Download a complete, structured JSON snapshot of all metrics, classifications, awards, and
              findings. All authentication tokens and secrets are guaranteed 100% redacted.
            </p>
          </div>

          <Button variant="main" onClick={handleExportJson}>
            <Download className="size-4" /> DOWNLOAD DOSSIER (JSON)
          </Button>
        </div>

        {/* Import Card */}
        <div className="border-[3px] border-black p-5 rounded-[8px] bg-[#EFF6FF] flex flex-col justify-between gap-4 shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-150">
          <div className="flex flex-col gap-2">
            <h3 className="font-black text-base uppercase flex items-center gap-2">
              <Upload className="size-5" /> IMPORT DOSSIER FILE
            </h3>
            <p className="text-xs text-gray-700 font-semibold leading-relaxed">
              Upload a previously exported Gitopsy JSON file. The report will be rigorously validated against
              the forensic schema with Zod.
            </p>
          </div>

          <label className="cursor-pointer">
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            <span className="neo-btn bg-[#4D96FF] text-black px-4 py-2.5 inline-flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wide w-full">
              <Upload className="size-4" /> SELECT DOSSIER FILE
            </span>
          </label>
        </div>
      </div>

      {importStatus && (
        <div className="border-[2px] border-black bg-amber-100 p-3 rounded text-xs font-mono font-bold">
          {importStatus}
        </div>
      )}

      {/* Purge Local Storage */}
      <div className="border-[3px] border-red-600 bg-red-50 p-5 rounded-[8px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[4px_4px_0_0_#000]">
        <div className="flex items-start gap-3">
          <AlertTriangle className="size-6 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-black uppercase text-sm text-red-900">INCINERATE LOCAL DATABASE</h4>
            <p className="text-xs text-red-700 font-medium">
              Permanently erase all IndexedDB records and cached specimen histories on this browser.
            </p>
          </div>
        </div>

        <Button variant="destructive" size="sm" onClick={handlePurgeAll}>
          <Trash2 className="size-4" /> PURGE ALL DATA
        </Button>
      </div>
    </div>
  );
}
