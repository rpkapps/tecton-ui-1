/**
 * Internal to `@tecton/react`: one visually hidden live region per
 * politeness level, appended to the document body, for announcements that
 * have no element of their own (a selection changed, a drag started, a
 * value was copied). Outside groups and toolbars, so nothing flattens it
 * away; inline styles, so it stays hidden where the page's utilities do not
 * reach (a scoped `ThemeRoot` remote).
 */

type Politeness = "polite" | "assertive"

const regions = new Map<Politeness, HTMLElement>()

function regionFor(politeness: Politeness, slot: string) {
  let region = regions.get(politeness)
  if (!region?.isConnected) {
    region = document.createElement("div")
    region.setAttribute("data-slot", slot)
    region.setAttribute("aria-live", politeness)
    region.setAttribute("aria-atomic", "true")
    Object.assign(region.style, {
      position: "absolute",
      width: "1px",
      height: "1px",
      margin: "-1px",
      padding: "0",
      overflow: "hidden",
      clip: "rect(0 0 0 0)",
      clipPath: "inset(50%)",
      whiteSpace: "nowrap",
      border: "0",
    })
    document.body.append(region)
    regions.set(politeness, region)
  }
  return region
}

/**
 * Speaks `message`. The region is emptied first and filled a moment later:
 * a region that was just created is not tracked yet, and the same message
 * twice in a row must still be a change.
 */
function announce(
  message: string,
  {
    politeness = "polite",
    slot = "announcer",
  }: { politeness?: Politeness; slot?: string } = {}
) {
  if (typeof document === "undefined" || !message) return
  const region = regionFor(politeness, slot)
  region.textContent = ""
  setTimeout(() => {
    region.textContent = message
  }, 100)
}

export { announce }
export type { Politeness }
