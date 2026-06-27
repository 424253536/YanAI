import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground flex min-h-32 w-full rounded-xl border bg-white/88 px-4 py-3 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none transition-[box-shadow,background,border] focus-visible:border-[#2563eb]/45 focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-[#2563eb]/18 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
