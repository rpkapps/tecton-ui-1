import { afterEach, beforeEach, vi } from "vitest"

/**
 * jsdom has no Web Animations: for the tests of the enclosing `describe`,
 * `Element.prototype.animate` records its calls (endless animations).
 */
function stubAnimations() {
  const animate = vi.fn(function (this: Element) {
    return {
      finished: new Promise(() => {}),
      cancel() {},
    } as unknown as Animation
  })
  beforeEach(() => {
    animate.mockClear()
    Element.prototype.animate = animate
  })
  afterEach(() => {
    delete (Element.prototype as { animate?: unknown }).animate
    // A landing preview waits for its animation.
    for (const ghost of document.querySelectorAll("[inert]")) ghost.remove()
  })

  /** Each animation's keyframes, and the element it ran on. */
  const animations = () =>
    animate.mock.calls.map((call, at) => ({
      element: animate.mock.contexts[at],
      keyframes: (call as unknown as [Array<Keyframe>])[0],
    }))

  return {
    animate,
    animations,
    /** The keyframes of each animation run on `element`. */
    keyframesOf: (element: Element) =>
      animations().flatMap((a) => (a.element === element ? [a.keyframes] : [])),
    /** The translate each element slid from, by `nameOf(element)`. */
    slides: (nameOf: (element: Element) => string | null) =>
      new Map(
        animations().flatMap(({ element, keyframes }) => {
          const from = keyframes[0]?.translate
          return from === undefined
            ? []
            : [[nameOf(element), String(from)] as const]
        })
      ),
  }
}

export { stubAnimations }
