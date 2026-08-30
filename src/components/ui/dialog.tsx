import React, { useEffect } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { X } from "lucide-react";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  className?: string;
  children: React.ReactNode;
}

export function Dialog({ isOpen, onClose, title, className, children }: DialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-100">
      <div
        className={twMerge(
          clsx(
            "relative w-full max-w-lg bg-white border-[4px] border-black rounded-[10px] shadow-[6px_6px_0_0_#000] sm:shadow-[10px_10px_0_0_#000] p-4 sm:p-6 text-black animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto",
            className
          )
        )}
      >
        <div className="flex items-center justify-between pb-3 border-b-[3px] border-black mb-4">
          {title ? (
            <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">{title}</h2>
          ) : (
            <div />
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 border-[2px] border-black rounded-[4px] bg-[#FF6B6B] shadow-[2px_2px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] cursor-pointer"
          >
            <X className="size-4 text-black stroke-[3]" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
