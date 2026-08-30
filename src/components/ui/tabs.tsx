import React, { createContext, useContext } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface TabsContextType {
  value: string;
  onValueChange: (val: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

export function Tabs({
  value,
  onValueChange,
  className,
  children,
  ...props
}: {
  value: string;
  onValueChange: (val: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={twMerge(clsx("flex flex-col gap-4", className))} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge(
        clsx(
          "inline-flex items-stretch gap-1 p-1 bg-gray-100/90 border-[1.5px] border-black rounded-[8px]",
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const context = useContext(TabsContext);
  const isSelected = context?.value === value;

  return (
    <button
      type="button"
      onClick={() => context?.onValueChange(value)}
      className={twMerge(
        clsx(
          "px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-[6px] transition-all cursor-pointer select-none whitespace-nowrap inline-flex items-center justify-center shadow-none",
          isSelected
            ? "bg-[#FFDC58] text-black border-[1.5px] border-black"
            : "text-gray-600 hover:text-black hover:bg-black/5 border-[1.5px] border-transparent",
          className
        )
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const context = useContext(TabsContext);
  if (context?.value !== value) return null;

  return (
    <div className={twMerge(clsx("animate-in fade-in duration-150", className))} {...props}>
      {children}
    </div>
  );
}
