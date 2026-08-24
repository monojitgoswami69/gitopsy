import React, { forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accentColor?: "main" | "coral" | "cyan" | "lime" | "purple" | "white";
  shadowSize?: "sm" | "md" | "lg";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, accentColor = "white", shadowSize = "md", children, ...props }, ref) => {
    const bgColors = {
      white: "bg-white",
      main: "bg-[#FFDC58]",
      coral: "bg-[#FF6B6B]",
      cyan: "bg-[#4D96FF]",
      lime: "bg-[#6BCB77]",
      purple: "bg-[#C084FC]",
    };

    const shadows = {
      sm: "shadow-[3px_3px_0_0_#000]",
      md: "shadow-[6px_6px_0_0_#000]",
      lg: "shadow-[10px_10px_0_0_#000]",
    };

    return (
      <div
        ref={ref}
        className={twMerge(
          clsx(
            "border-[3px] border-black rounded-[8px] p-5 text-black",
            bgColors[accentColor],
            shadows[shadowSize],
            className
          )
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={twMerge(clsx("flex flex-col gap-1.5 pb-4 border-b-[2px] border-black/10 mb-4", className))} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={twMerge(clsx("text-lg font-black tracking-tight uppercase flex items-center gap-2", className))} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={twMerge(clsx("text-xs font-medium text-gray-700 leading-relaxed", className))} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={twMerge(clsx("", className))} {...props}>{children}</div>;
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={twMerge(clsx("flex items-center pt-4 border-t-[2px] border-black/10 mt-4", className))} {...props}>
      {children}
    </div>
  );
}
