import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

/** Four-point star from the ornaments of the SIC artwork. */
export function BrandStar({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={cn("shrink-0", className)}>
      <path d="M12 0 L14.2 9.8 L24 12 L14.2 14.2 L12 24 L9.8 14.2 L0 12 L9.8 9.8 Z" fill="currentColor" />
      <path d="M12 6 L13 11 L18 12 L13 13 L12 18 L11 13 L6 12 L11 11 Z" fill="var(--color-bg)" opacity="0.55" />
    </svg>
  );
}

/** Club seal (public/logo.png) with the SIC wordmark and college line. */
export function Logo({ compact = false, size = "md" }: { compact?: boolean; size?: "md" | "lg" }) {
  const lg = size === "lg";
  const px = lg ? 64 : 38;
  return (
    <Link href="/" className="group inline-flex items-center gap-3" aria-label="SIC, Science & Innovation Club, GEC Palamu: home">
      <span className="logo-badge" style={{ width: px, height: px }}>
        <Image src="/logo.png" alt="" width={px * 2} height={px * 2} priority className="size-full" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className={cn("font-brand font-black tracking-[0.12em]", lg ? "text-4xl" : "text-[1.1875rem]")}>SIC</span>
          <span className={cn("hud-label text-muted", lg ? "mt-1.5 text-[0.75rem]" : "mt-0.5 hidden text-[0.625rem] min-[400px]:block")}>GEC Palamu</span>
        </span>
      )}
    </Link>
  );
}
