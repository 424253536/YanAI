import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground flex min-h-32 w-full rounded-xl border bg-[#fffaf2]/78 px-4 py-3 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.62)] outline-none transition-[box-shadow,background,border] focus-visible:border-[rgba(143,93,47,0.36)] focus-visible:bg-[#fffdf8] focus-visible:ring-[3px] focus-visible:ring-[rgba(181,138,82,0.22)] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
