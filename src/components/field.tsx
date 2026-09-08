import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="block text-[11px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

export function SelectField({
  className,
  ...props
}: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-10 w-full appearance-none rounded-[10px] border border-input bg-[#fafafa] px-3 text-[15px] outline-none focus-visible:border-ring focus-visible:bg-white",
        className,
      )}
      {...props}
    />
  );
}

export function CardBlock({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "mb-3 rounded-[14px] bg-card p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.10)]",
        className,
      )}
    >
      {title ? (
        <div className="mb-3 flex items-center gap-2 text-xs font-bold tracking-[0.08em] text-primary uppercase">
          <span className="size-1.5 rounded-full bg-[#2d9e6e]" />
          {title}
        </div>
      ) : null}
      {children}
    </section>
  );
}
