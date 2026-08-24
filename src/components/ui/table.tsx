import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function Table({ className, children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto border-[3px] border-black rounded-[8px] shadow-[4px_4px_0_0_#000] bg-white">
      <table className={twMerge(clsx("w-full text-left text-sm border-collapse", className))} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={twMerge(clsx("bg-[#FFDC58] text-black border-b-[3px] border-black font-black uppercase text-xs tracking-wider", className))} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={twMerge(clsx("divide-y-[2px] divide-black/20", className))} {...props}>{children}</tbody>;
}

export function TableRow({ className, children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={twMerge(clsx("hover:bg-amber-50/60 transition-colors", className))} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ className, children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={twMerge(clsx("p-3.5 font-black text-black border-r-[2px] last:border-r-0 border-black", className))} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ className, children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={twMerge(clsx("p-3.5 border-r-[2px] last:border-r-0 border-black/10 font-mono text-xs", className))} {...props}>
      {children}
    </td>
  );
}
