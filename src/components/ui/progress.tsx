import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  barColor?: "main" | "coral" | "cyan" | "lime" | "purple";
  striped?: boolean;
}

export function Progress({
  className,
  value,
  barColor = "main",
  striped = false,
  ...props
}: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));

  const colors = {
    main: "bg-[#FFDC58]",
    coral: "bg-[#FF6B6B]",
    cyan: "bg-[#4D96FF]",
    lime: "bg-[#6BCB77]",
    purple: "bg-[#C084FC]",
  };

  return (
    <div
      className={twMerge(
        clsx(
          "w-full h-7 bg-white border-[3px] border-black rounded-[6px] overflow-hidden shadow-[3px_3px_0_0_#000] relative",
          className
        )
      )}
      {...props}
    >
      <div
        className={clsx(
          "h-full border-r-[3px] border-black transition-all duration-300 ease-out flex items-center justify-end pr-2",
          colors[barColor],
          striped &&
            "bg-[repeating-linear-gradient(45deg,#FFDC58,#FFDC58_10px,#121212_10px,#121212_20px)]"
        )}
        style={{ width: `${clamped}%` }}
      />
      <span className="absolute inset-0 flex items-center justify-center text-xs font-black uppercase tracking-wider text-black pointer-events-none drop-shadow-[0_1px_0_#fff]">
        {clamped}%
      </span>
    </div>
  );
}
