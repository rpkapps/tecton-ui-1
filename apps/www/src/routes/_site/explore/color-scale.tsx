import { createFileRoute } from "@tanstack/react-router"

import ColorScaleExploration from "@/explore/color-scale/page"
import { siteConfig } from "@/lib/site"

export const Route = createFileRoute("/_site/explore/color-scale")({
  head: () => ({
    meta: [{ title: `Colour scale exploration – ${siteConfig.name}` }],
  }),
  component: ColorScaleExplorationPage,
})

function ColorScaleExplorationPage() {
  return (
    <div className="container-wrapper flex flex-1 flex-col px-6">
      <ColorScaleExploration />
    </div>
  )
}
