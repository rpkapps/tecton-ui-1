import { siteConfig } from "@/lib/site"

export function SiteFooter() {
  return (
    <footer className="group-has-[.docs-nav]/body:pb-20 group-has-[[data-slot=docs]]/body:hidden group-has-[.docs-nav]/body:sm:pb-0">
      <div className="container-wrapper px-4 xl:px-6">
        <div className="flex h-(--footer-height) items-center justify-between">
          <div className="w-full px-1 text-center text-xs leading-loose text-muted-foreground sm:text-sm">
            {siteConfig.name} is built on{" "}
            <a
              href="https://ui.shadcn.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              shadcn/ui
            </a>{" "}
            (React Aria base) and themed through the Tecton design tokens.
            Package: <span className="font-mono">{siteConfig.package}</span>.
          </div>
        </div>
      </div>
    </footer>
  )
}
