import { cn } from "cn"

export function TectonLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn("text-foreground", className)}
    >
      <path
        d="M3 6h18M6 12h12M9 18h6"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
      <circle cx="19" cy="18" r="2" fill="var(--ring)" />
    </svg>
  )
}
