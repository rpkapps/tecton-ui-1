import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { TectonProvider } from "@tecton/react/tecton/provider"

import CanvasPage from "../blocks/canvas-01/page"
import DetailPage from "../blocks/detail-01/page"
import Sidebar01 from "../blocks/sidebar-01/page"
import Sidebar02 from "../blocks/sidebar-02/page"
import Sidebar03 from "../blocks/sidebar-03/page"
import Sidebar04 from "../blocks/sidebar-04/page"

const pages = {
  "sidebar-01": Sidebar01,
  "sidebar-02": Sidebar02,
  "sidebar-03": Sidebar03,
  "sidebar-04": Sidebar04,
  "canvas-01": CanvasPage,
  "detail-01": DetailPage,
}

/** The edge of the first (start) sidebar: `side` is physical. */
function startSide(container: HTMLElement) {
  return container
    .querySelector("[data-slot=sidebar][data-side]")
    ?.getAttribute("data-side")
}

describe("block sidebars follow the reading direction", () => {
  for (const [name, Page] of Object.entries(pages)) {
    it(`${name} puts its start sidebar on the start edge`, () => {
      const ltr = render(
        <TectonProvider direction="ltr">
          <Page />
        </TectonProvider>
      )
      expect(startSide(ltr.container)).toBe("left")
      ltr.unmount()

      const rtl = render(
        <TectonProvider direction="rtl">
          <div dir="rtl">
            <Page />
          </div>
        </TectonProvider>
      )
      expect(startSide(rtl.container)).toBe("right")
      rtl.unmount()
    })
  }
})
