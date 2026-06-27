"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-1 text-sm text-stone-800", className)}
      classNames={{
        months: "flex flex-col gap-4 sm:flex-row",
        month: "relative",
        month_caption: "flex h-9 items-center justify-center font-semibold tracking-tight text-stone-950",
        nav: "absolute inset-x-2 top-2 flex items-center justify-between",
        button_previous: "inline-flex size-8 items-center justify-center rounded-xl border border-[rgba(37,99,235,0.12)] bg-[#ffffff]/62 hover:bg-[#eff6ff]",
        button_next: "inline-flex size-8 items-center justify-center rounded-xl border border-[rgba(37,99,235,0.12)] bg-[#ffffff]/62 hover:bg-[#eff6ff]",
        weekdays: "mt-2 grid grid-cols-7 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500",
        weekday: "flex h-8 items-center justify-center",
        week: "grid grid-cols-7",
        day: "size-9 p-0 text-center",
        day_button: "size-9 rounded-xl text-sm transition hover:bg-[#dbeafe]/70",
        today: "font-semibold text-stone-950",
        selected: "[&_button]:bg-[#1e3a8a] [&_button]:text-[#ffffff] [&_button]:shadow-[0_8px_20px_rgba(15,23,42,0.16)] [&_button]:hover:bg-[#1d4ed8]",
        outside: "text-stone-300",
        disabled: "text-stone-300 opacity-50",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />,
      }}
      {...props}
    />
  );
}

export { Calendar };
