import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Instrument-panel building blocks for the public site: numbered section
 * headings, bracket links, chamfered panels. Pure CSS, colours from tokens.
 */

export function SectionHead({
  index,
  title,
  kicker,
  action,
}: {
  index: string;
  title: string;
  kicker?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 text-subtle">
        <span className="hud-label text-primary">{index}</span>
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
        {kicker && <span className="hud-label hidden sm:inline">{kicker}</span>}
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-brand text-[clamp(1.8rem,4vw,2.8rem)] font-black uppercase leading-none tracking-[0.04em]">{title}</h2>
        {action}
      </div>
    </div>
  );
}

/** "[ Label → ]" text link. */
export function BracketLink({ children, className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        "group hud-label inline-flex items-center gap-2 py-2 text-[0.75rem] text-muted transition-colors hover:text-primary",
        className,
      )}
      {...props}
    >
      <span className="text-primary">[</span>
      <span>{children}</span>
      <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
        →
      </span>
      <span className="text-primary">]</span>
    </Link>
  );
}

/** Primary call to action with cut corners. */
export function ChamferButton({ className, children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        "chamfer hud-label inline-flex h-12 items-center gap-3 bg-primary px-6 text-[0.8125rem] text-on-primary transition-colors hover:bg-primary-hover",
        className,
      )}
      style={{ ["--cut" as string]: "12px" }}
      {...props}
    >
      {children}
      <span aria-hidden="true">→</span>
    </Link>
  );
}

/** Panel with a 1px chamfered outline. Pass `href` to make the whole panel a link. */
export function ChamferPanel({
  href,
  className,
  innerClassName,
  children,
}: {
  href?: string;
  className?: string;
  innerClassName?: string;
  children: ReactNode;
}) {
  const inner = <div className={cn("chamfer chamfer-inner", innerClassName)}>{children}</div>;
  return href ? (
    <Link href={href} className={cn("chamfer chamfer-frame is-link group block", className)}>
      {inner}
    </Link>
  ) : (
    <div className={cn("chamfer chamfer-frame", className)}>{inner}</div>
  );
}
