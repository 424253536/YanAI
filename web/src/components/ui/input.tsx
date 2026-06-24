import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-11 w-full min-w-0 rounded-xl border bg-[#fffaf2]/78 px-4 py-2 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.62)] transition-[color,box-shadow,background,border] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-[rgba(143,93,47,0.36)] focus-visible:bg-[#fffdf8] focus-visible:ring-[3px] focus-visible:ring-[rgba(181,138,82,0.22)]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
