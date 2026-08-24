"use client";

import React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DeterministicEasterEgg } from "@/types/domain";
import { Zap, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

export function EasterEggModal({
  egg,
  isOpen,
  onClose,
}: {
  egg: DeterministicEasterEgg | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!egg) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="CLASSIFIED EVIDENCE UNLOCKED">
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className="p-4 bg-[#FFDC58] border-[3px] border-black rounded-full shadow-[4px_4px_0_0_#000]">
          <Zap className="size-10 text-black fill-black animate-bounce" />
        </div>

        <h3 className="text-xl font-black uppercase tracking-tight">{egg.title}</h3>

        <div className="border-[2px] border-black bg-amber-50 p-4 rounded-[6px] text-xs font-mono font-bold text-gray-800 w-full text-left">
          <div className="text-[10px] uppercase text-gray-500 mb-1">TRIGGER CRITERIA:</div>
          <div>{egg.trigger}</div>
        </div>

        <p className="text-sm font-black text-black bg-[#C084FC]/30 border border-black p-3 rounded w-full">
          &ldquo;{egg.dialogue}&rdquo;
        </p>

        <Button
          variant="main"
          className="w-full mt-2"
          onClick={() => {
            confetti({ particleCount: 80, spread: 60 });
            onClose();
          }}
        >
          <Sparkles className="size-4" /> ACKNOWLEDGE CLASSIFIED FILE
        </Button>
      </div>
    </Dialog>
  );
}
