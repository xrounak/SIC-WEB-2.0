import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

// Look lives in globals.css (.btn, .btn-<variant>, .btn-<size>); this only adds sizing.
const sizes: Record<Size, string> = {
  sm: "btn-sm h-8 px-3 text-[0.6875rem]",
  md: "btn-md h-10 px-5 text-[0.75rem]",
  lg: "btn-lg h-12 px-6 text-[0.8125rem]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn("btn", `btn-${variant}`, sizes[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
