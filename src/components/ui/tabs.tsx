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
          "inline-flex flex-wrap gap-2 p-1.5 bg-gray-100 border-[3px] border-black rounded-[8px] shadow-[4px_4px_0_0_#000]",
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
          "px-4 py-2 text-xs font-black uppercase tracking-wider rounded-[4px] border-[2px] transition-all cursor-pointer select-none",
          isSelected
            ? "bg-[#FFDC58] text-black border-black shadow-[2px_2px_0_0_#000] translate-y-[-1px]"
            : "bg-white text-gray-700 border-transparent hover:border-black/30 hover:bg-gray-50",
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
