import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "warning" | "destructive" | "success";
  title?: string;
}

export function Alert({
  className,
  variant = "info",
  title,
  children,
  ...props
}: AlertProps) {
  const styles = {
    info: {
      bg: "bg-[#4D96FF]/15 border-[#4D96FF]",
      icon: <Info className="size-5 text-[#4D96FF] shrink-0 stroke-[2.5]" />,
    },
    warning: {
      bg: "bg-[#FFDC58] border-black",
      icon: <AlertTriangle className="size-5 text-black shrink-0 stroke-[2.5]" />,
    },
    destructive: {
      bg: "bg-[#FF6B6B] border-black",
      icon: <AlertCircle className="size-5 text-black shrink-0 stroke-[2.5]" />,
    },
    success: {
      bg: "bg-[#6BCB77] border-black",
      icon: <CheckCircle2 className="size-5 text-black shrink-0 stroke-[2.5]" />,
    },
  };

  const selected = styles[variant];

  return (
    <div
      className={twMerge(
        clsx(
          "flex items-start gap-3 p-4 border-[3px] border-black rounded-[8px] shadow-[4px_4px_0_0_#000] text-black",
          selected.bg,
          className
        )
      )}
      {...props}
    >
      {selected.icon}
      <div className="flex flex-col gap-1">
        {title && <h5 className="font-black uppercase text-sm tracking-wide">{title}</h5>}
        <div className="text-xs font-semibold leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
