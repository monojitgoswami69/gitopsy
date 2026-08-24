import React from "react";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t-[3px] border-black bg-[#F4EFE6] px-4 sm:px-6 py-6 mt-16 text-black">
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div className="flex items-center gap-3">
          <div className="relative size-8 shrink-0">
            <Image
              src="/gitopsy-logo.png"
              alt="Gitopsy Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <div>
            <div className="text-sm font-black uppercase tracking-tight">
              GITOPSY • FORENSIC ENGINEERING INTELLIGENCE
            </div>
            <div className="text-xs text-gray-600 font-bold">
              Privacy Invariant: Zero cloud database. 100% in-browser IndexedDB &amp; Web Worker execution.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-black uppercase text-gray-700">
          <span className="flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-800 px-2 py-1 rounded">
            <ShieldCheck className="size-3.5" /> NO TELEMETRY OR TRACKERS
          </span>
          <span>© {new Date().getFullYear()} GITOPSY</span>
        </div>
      </div>
    </footer>
  );
}
