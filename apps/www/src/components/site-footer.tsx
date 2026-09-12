import { siteConfig } from "@/lib/site"

export function SiteFooter() {
  return (
    <footer className="border-t border-border-subtle">
      <div className="mx-auto flex w-full max-w-(--breakpoint-2xl) flex-col gap-2 px-4 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
        <p>
          {siteConfig.name} — built on{" "}
          <a
            href="https://ui.shadcn.com"
            className="underline underline-offset-4 hover:text-foreground"
          >
            shadcn/ui
          </a>{" "}
          (React Aria base) and themed through the Tecton design tokens.
        </p>
        <p className="font-mono">{siteConfig.package}</p>
      </div>
    </footer>
  )
}
