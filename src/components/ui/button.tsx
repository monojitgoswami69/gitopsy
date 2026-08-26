import React, { forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "main" | "accent" | "coral" | "cyan" | "lime" | "purple" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "main", size = "md", children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-bold tracking-wide uppercase transition-all duration-100 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none rounded-[6px]";

    const variantStyles = {
      main: "bg-[#FFDC58] hover:bg-[#ffe27a] text-black border-[2px] border-black shadow-[2px_2px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
      accent: "bg-[#FD9745] hover:bg-[#ffaa66] text-black border-[2px] border-black shadow-[2px_2px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
      coral: "bg-[#FF6B6B] hover:bg-[#ff8585] text-black border-[2px] border-black shadow-[2px_2px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
      cyan: "bg-[#4D96FF] hover:bg-[#6ba6ff] text-black border-[2px] border-black shadow-[2px_2px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
      lime: "bg-[#6BCB77] hover:bg-[#83d68d] text-black border-[2px] border-black shadow-[2px_2px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
      purple: "bg-[#C084FC] hover:bg-[#cf9eff] text-black border-[2px] border-black shadow-[2px_2px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
      outline: "bg-white hover:bg-neutral-100 text-black border-[2px] border-black shadow-[2px_2px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
      ghost: "bg-transparent text-black border-[2px] border-transparent hover:border-black hover:bg-black/5 active:translate-x-[1px] active:translate-y-[1px]",
      destructive: "bg-red-600 hover:bg-red-500 text-white border-[2px] border-black shadow-[2px_2px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
    };

    const sizeStyles = {
      sm: "h-9 px-3 text-xs gap-1.5",
      md: "h-11 px-5 text-sm gap-2",
      lg: "h-13 px-7 text-base gap-2.5",
      icon: "h-11 w-11 p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={twMerge(clsx(baseStyles, variantStyles[variant], sizeStyles[size], className))}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
