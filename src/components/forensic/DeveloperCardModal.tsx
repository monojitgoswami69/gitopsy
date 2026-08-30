"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { GitopsyAnalysis } from "@/types/domain";
import { buildDeveloperCardData } from "@/lib/analytics/developerCard";
import {
  downloadDeveloperCard,
  copyDeveloperCardToClipboard,
  shareNativeDeveloperCard,
  drawDeveloperCard,
} from "@/lib/export/shareCardCanvas";
import { Button } from "@/components/ui/button";
import { X, Download, Copy, Share2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DeveloperCardModalProps {
  report: GitopsyAnalysis;
  onClose: () => void;
}

export function DeveloperCardModal({ report, onClose }: DeveloperCardModalProps) {
  const [mounted, setMounted] = useState(false);
  const cardData = React.useMemo(() => buildDeveloperCardData(report), [report]);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const avatarImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Preload avatar once and draw card
  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw initial layout immediately
    drawDeveloperCard(ctx, cardData, avatarImgRef.current);

    if (cardData.avatarUrl && !avatarImgRef.current) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        avatarImgRef.current = img;
        if (canvasRef.current) {
          const currentCtx = canvasRef.current.getContext("2d");
          if (currentCtx) {
            drawDeveloperCard(currentCtx, cardData, img);
          }
        }
      };
      img.src = cardData.avatarUrl;
    }
  }, [mounted, cardData]);

  // Keyboard navigation: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleCopy = async () => {
    setIsExporting(true);
    const success = await copyDeveloperCardToClipboard(cardData);
    setIsExporting(false);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } else {
      downloadDeveloperCard(cardData);
    }
  };

  const handleDownload = async () => {
    setIsExporting(true);
    await downloadDeveloperCard(cardData);
    setIsExporting(false);
  };

  const handleShare = async () => {
    setIsExporting(true);
    const shared = await shareNativeDeveloperCard(cardData);
    setIsExporting(false);
    if (!shared) {
      handleCopy();
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 md:p-6 text-black select-none overflow-y-auto">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-[460px] sm:max-w-[480px] bg-white border-[4px] border-black rounded-[14px] shadow-[10px_10px_0_0_#000] flex flex-col overflow-hidden my-auto max-h-[92vh]"
        >
          {/* Header Bar */}
          <div className="bg-[#FFDC58] border-b-[3px] border-black p-3 sm:p-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-xs uppercase bg-black text-[#FFDC58] px-2 py-0.5 rounded shadow-[1px_1px_0_0_#000]">
                DEVELOPER CARD
              </span>
              <span className="font-mono font-black text-xs text-black hidden sm:inline">
                {cardData.fileNo}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1 sm:p-1.5 rounded-[6px] bg-white border-[2px] border-black hover:bg-black hover:text-white transition-all shadow-[2px_2px_0_0_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              aria-label="Close Developer Card"
            >
              <X className="size-4 stroke-[2.5]" />
            </button>
          </div>

          {/* 4:5 Portrait Card Preview Stage */}
          <div className="p-3 sm:p-4 flex flex-col items-center justify-center bg-neutral-100/90 overflow-hidden min-h-0 flex-1">
            <div className="relative w-full max-h-[64vh] aspect-[4/5] border-[3px] border-black rounded-[8px] overflow-hidden shadow-[4px_4px_0_0_#000] bg-white flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={2160}
                height={2700}
                className="w-full h-full object-contain max-h-[64vh]"
              />
            </div>
          </div>

          {/* Action Controls Footer */}
          <div className="bg-white border-t-[3px] border-black p-3 sm:p-3.5 flex items-center justify-between gap-2 shrink-0">
            <div className="text-[11px] font-mono font-bold text-gray-600 hidden sm:flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-emerald-500" />
              <span>GITOPSY DEVELOPER CARD</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                disabled={isExporting}
                className="font-black text-xs gap-1.5 shadow-[2px_2px_0_0_#000]"
              >
                {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                <span>{copied ? "COPIED" : "COPY IMAGE"}</span>
              </Button>

              <Button
                size="sm"
                variant="main"
                onClick={handleShare}
                disabled={isExporting}
                className="font-black text-xs gap-1.5 shadow-[3px_3px_0_0_#000] bg-[#4D96FF] hover:bg-[#6ba6ff]"
              >
                <Share2 className="size-3.5" />
                <span>SHARE</span>
              </Button>

              <Button
                size="sm"
                variant="main"
                onClick={handleDownload}
                disabled={isExporting}
                className="font-black text-xs gap-1.5 shadow-[3px_3px_0_0_#000] bg-[#FFDC58] hover:bg-[#FACC15]"
              >
                <Download className="size-3.5" />
                <span>DOWNLOAD</span>
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  );
}
