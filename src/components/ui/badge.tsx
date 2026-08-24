import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "main" | "coral" | "cyan" | "lime" | "purple" | "neutral" | "dark";
}

export function Badge({ className, variant = "main", children, ...props }: BadgeProps) {
  const variantStyles = {
    main: "bg-[#FFDC58] text-black",
    coral: "bg-[#FF6B6B] text-black",
    cyan: "bg-[#4D96FF] text-black",
    lime: "bg-[#6BCB77] text-black",
    purple: "bg-[#C084FC] text-black",
    neutral: "bg-white text-black",
    dark: "bg-black text-white",
  };

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-black uppercase tracking-wider border-[2px] border-black rounded-[4px] shadow-[2px_2px_0_0_#000] select-none",
          variantStyles[variant],
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
}
