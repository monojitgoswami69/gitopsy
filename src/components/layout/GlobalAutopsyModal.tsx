"use client";

import React from "react";
import { useAutopsyStore } from "@/lib/store/autopsyStore";
import { AutopsyProgressModal } from "@/components/forensic/AutopsyProgressModal";

export function GlobalAutopsyModal() {
  const { progress } = useAutopsyStore();

  if (!progress.isAnalyzing) {
    return null;
  }

  return <AutopsyProgressModal {...progress} isOpen={progress.isAnalyzing} />;
}
