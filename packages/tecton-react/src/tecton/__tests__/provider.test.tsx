import * as React from "react"
import { useDirection as useBaseUiDirection } from "@base-ui/react/direction-provider"
import { render, renderHook, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { renderToString } from "react-dom/server"
import {
  Link as AriaLink,
  useLocale as useAriaLocale,
} from "react-aria-components"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  usePortalContainer,
  usePortalTarget,
} from "@tecton/react/tecton/portal"
import {
  AriaBridge,
  localeDirection,
  shouldClientNavigate,
  TectonProvider,
  useDirection,
  useLocale,
  useTectonRouter,
  type TectonProviderProps,
} from "@tecton/react/tecton/provider"

type Props = Omit<TectonProviderProps, "children">

function wrapper(...layers: Props[]) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return layers.reduceRight<React.ReactNode>(
      (inner, props) => <TectonProvider {...props}>{inner}</TectonProvider>,
      children
    ) as React.ReactElement
  }
}

function useEverything() {
  return {
    ...useLocale(),
    tectonDirection: useDirection(),
    baseUiDirection: useBaseUiDirection(),
    router: useTectonRouter(),
    container: usePortalContainer(),
  }
}

function makeContainer(name: string) {
  const container = document.createElement("div")
  container.setAttribute("data-test-container", name)
  document.body.append(container)
  return container
}

afterEach(() => {
  vi.restoreAllMocks()
  document
    .querySelectorAll("[data-test-container]")
    .forEach((element) => element.remove())
})

describe("TectonProvider defaults", () => {
  it("is ltr with the browser locale and no router without any provider", () => {
    vi.spyOn(navigator, "language", "get").mockReturnValue("fr-FR")
    const { result } = renderHook(useEverything)
    expect(result.current.locale).toBe("fr-FR")
    expect(result.current.direction).toBe("ltr")
    expect(result.current.tectonDirection).toBe("ltr")
    expect(result.current.baseUiDirection).toBe("ltr")
    expect(result.current.router).toEqual({
      navigate: undefined,
      useHref: undefined,
    })
    expect(result.current.container).toBeNull()
  })

  it("keeps ltr for an rtl browser locale when nothing is set", () => {
    vi.spyOn(navigator, "language", "get").mockReturnValue("ar-EG")
    const { result } = renderHook(useEverything, { wrapper: wrapper({}) })
    expect(result.current.locale).toBe("ar-EG")
    expect(result.current.direction).toBe("ltr")
    expect(result.current.baseUiDirection).toBe("ltr")
  })

  it("renders no DOM of its own", () => {
    const { container } = render(
      <TectonProvider direction="rtl" locale="he">
        <span>child</span>
      </TectonProvider>
    )
    expect(container.innerHTML).toBe("<span>child</span>")
  })
})

describe("TectonProvider locale and direction", () => {
  it("derives the direction from the locale", () => {
    for (const [locale, direction] of [
      ["ar-EG", "rtl"],
      ["he", "rtl"],
      ["fa-IR", "rtl"],
      ["ur", "rtl"],
      ["en-US", "ltr"],
      ["de", "ltr"],
      ["ja-JP", "ltr"],
    ] as const) {
      const { result } = renderHook(useEverything, {
        wrapper: wrapper({ locale }),
      })
      expect(result.current).toMatchObject({
        locale,
        direction,
        tectonDirection: direction,
        baseUiDirection: direction,
      })
    }
  })

  it("lets direction win over the locale", () => {
    const { result } = renderHook(useEverything, {
      wrapper: wrapper({ locale: "ar-EG", direction: "ltr" }),
    })
    expect(result.current.locale).toBe("ar-EG")
    expect(result.current.direction).toBe("ltr")
    expect(result.current.baseUiDirection).toBe("ltr")
  })

  it("sets rtl without a locale and keeps the browser locale", () => {
    vi.spyOn(navigator, "language", "get").mockReturnValue("en-GB")
    const { result } = renderHook(useEverything, {
      wrapper: wrapper({ direction: "rtl" }),
    })
    expect(result.current.locale).toBe("en-GB")
    expect(result.current.direction).toBe("rtl")
    expect(result.current.baseUiDirection).toBe("rtl")
  })

  it("reads the direction of a script subtag and of an unknown tag", () => {
    expect(localeDirection("ar-Latn")).toBe("ltr")
    expect(localeDirection("az-Arab")).toBe("rtl")
    expect(localeDirection("not a locale")).toBe("ltr")
  })
})

describe("TectonProvider nesting", () => {
  it("inherits every value a nested provider does not set", () => {
    const navigate = vi.fn()
    const useHref = (href: string) => `/base${href}`
    const outer = makeContainer("outer")
    const { result } = renderHook(useEverything, {
      wrapper: wrapper(
        {
          locale: "he-IL",
          navigate,
          useHref,
          portalContainer: outer,
        },
        {}
      ),
    })
    expect(result.current.locale).toBe("he-IL")
    expect(result.current.direction).toBe("rtl")
    expect(result.current.baseUiDirection).toBe("rtl")
    expect(result.current.router.navigate).toBe(navigate)
    expect(result.current.router.useHref).toBe(useHref)
    expect(result.current.container).toBe(outer)
  })

  it("overrides only what a nested provider sets", () => {
    const outerNavigate = vi.fn()
    const innerNavigate = vi.fn()
    const { result } = renderHook(useEverything, {
      wrapper: wrapper(
        { locale: "ar-EG", navigate: outerNavigate },
        { direction: "ltr" },
        { navigate: innerNavigate }
      ),
    })
    expect(result.current.locale).toBe("ar-EG")
    expect(result.current.direction).toBe("ltr")
    expect(result.current.baseUiDirection).toBe("ltr")
    expect(result.current.router.navigate).toBe(innerNavigate)
  })

  it("takes the direction of a nested locale over the inherited direction", () => {
    const { result } = renderHook(useEverything, {
      wrapper: wrapper({ direction: "rtl" }, { locale: "en-US" }),
    })
    expect(result.current.locale).toBe("en-US")
    expect(result.current.direction).toBe("ltr")
  })
})

describe("TectonProvider portalContainer", () => {
  it("passes an element through to the portal context", () => {
    const container = makeContainer("element")
    const { result } = renderHook(
      () => ({ container: usePortalContainer(), target: usePortalTarget() }),
      { wrapper: wrapper({ portalContainer: container }) }
    )
    expect(result.current.container).toBe(container)
    expect(result.current.target).toBe(container)
  })

  it("resolves a function container", () => {
    const container = makeContainer("function")
    const { result } = renderHook(usePortalContainer, {
      wrapper: wrapper({ portalContainer: () => container }),
    })
    expect(result.current).toBe(container)
  })

  it("clears an outer container with null and keeps it when unset", () => {
    const outer = makeContainer("outer")
    const cleared = renderHook(usePortalTarget, {
      wrapper: wrapper({ portalContainer: outer }, { portalContainer: null }),
    })
    expect(cleared.result.current).toBeUndefined()
    const kept = renderHook(usePortalTarget, {
      wrapper: wrapper({ portalContainer: outer }, { direction: "rtl" }),
    })
    expect(kept.result.current).toBe(outer)
  })
})

describe("AriaBridge", () => {
  function useAria() {
    return useAriaLocale()
  }

  function bridged(...layers: Props[]) {
    const Outer = wrapper(...layers)
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <Outer>
          <AriaBridge>{children}</AriaBridge>
        </Outer>
      )
    }
  }

  it("feeds React Aria the Tecton locale", () => {
    const { result } = renderHook(useAria, {
      wrapper: bridged({ locale: "he-IL" }),
    })
    expect(result.current).toEqual({ locale: "he-IL", direction: "rtl" })
  })

  it("forces the Tecton direction onto a locale written the other way", () => {
    const ltr = renderHook(useAria, {
      wrapper: bridged({ locale: "ar-EG", direction: "ltr" }),
    })
    expect(ltr.result.current.direction).toBe("ltr")
    expect(ltr.result.current.locale).toBe("ar-Latn-EG")

    const rtl = renderHook(useAria, {
      wrapper: bridged({ locale: "en-US", direction: "rtl" }),
    })
    expect(rtl.result.current.direction).toBe("rtl")
    expect(rtl.result.current.locale).toBe("en-Arab-US")
  })

  it("gives React Aria ltr and the browser locale without a provider", () => {
    vi.spyOn(navigator, "language", "get").mockReturnValue("ar-EG")
    const { result } = renderHook(useAria, {
      wrapper: ({ children }) => <AriaBridge>{children}</AriaBridge>,
    })
    expect(result.current.direction).toBe("ltr")
  })

  it("routes React Aria links through the Tecton navigate", async () => {
    const navigate = vi.fn()
    render(
      <TectonProvider navigate={navigate} useHref={(href) => `/app${href}`}>
        <AriaBridge>
          <AriaLink href="/wells">Wells</AriaLink>
        </AriaBridge>
      </TectonProvider>
    )
    const link = screen.getByRole("link", { name: "Wells" })
    expect(link).toHaveAttribute("href", "/app/wells")
    await userEvent.click(link)
    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate.mock.calls[0]?.[0]).toBe("/wells")
  })

  it("mounts no router without a navigate", () => {
    render(
      <TectonProvider>
        <AriaBridge>
          <AriaLink href="/wells">Plain</AriaLink>
        </AriaBridge>
      </TectonProvider>
    )
    expect(screen.getByRole("link", { name: "Plain" })).toHaveAttribute(
      "href",
      "/wells"
    )
  })
})

describe("shouldClientNavigate", () => {
  const plain = {
    button: 0,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    defaultPrevented: false,
  }

  function anchor(attributes: Record<string, string>) {
    const element = document.createElement("a")
    for (const [name, value] of Object.entries(attributes)) {
      element.setAttribute(name, value)
    }
    return element
  }

  it("accepts a plain primary click on a same-origin link", () => {
    expect(shouldClientNavigate(plain, anchor({ href: "/wells" }))).toBe(true)
    expect(
      shouldClientNavigate(plain, anchor({ href: "/wells", target: "_self" }))
    ).toBe(true)
  })

  it("leaves modified, secondary and handled clicks to the browser", () => {
    const link = anchor({ href: "/wells" })
    for (const key of ["metaKey", "ctrlKey", "altKey", "shiftKey"] as const) {
      expect(shouldClientNavigate({ ...plain, [key]: true }, link)).toBe(false)
    }
    expect(shouldClientNavigate({ ...plain, button: 1 }, link)).toBe(false)
    expect(
      shouldClientNavigate({ ...plain, defaultPrevented: true }, link)
    ).toBe(false)
  })

  it("leaves other origins, new windows, downloads and bare anchors alone", () => {
    expect(
      shouldClientNavigate(plain, anchor({ href: "https://example.org/x" }))
    ).toBe(false)
    expect(
      shouldClientNavigate(plain, anchor({ href: "/x", target: "_blank" }))
    ).toBe(false)
    expect(
      shouldClientNavigate(plain, anchor({ href: "/x", download: "" }))
    ).toBe(false)
    expect(shouldClientNavigate(plain, anchor({}))).toBe(false)
  })
})

describe("TectonProvider on the server", () => {
  function Probe() {
    const { locale, direction } = useLocale()
    const baseUi = useBaseUiDirection()
    const aria = useAriaLocale()
    return (
      <span
        data-locale={locale}
        data-direction={direction}
        data-base-ui={baseUi}
        data-aria={`${aria.locale}/${aria.direction}`}
      />
    )
  }

  it("renders with en-US as the default locale", () => {
    vi.spyOn(navigator, "language", "get").mockReturnValue("fr-FR")
    const html = renderToString(
      <TectonProvider>
        <AriaBridge>
          <Probe />
        </AriaBridge>
      </TectonProvider>
    )
    expect(html).toContain('data-locale="en-US"')
    expect(html).toContain('data-direction="ltr"')
    expect(html).toContain('data-base-ui="ltr"')
    expect(html).toContain('data-aria="en-US/ltr"')
  })

  it("renders an explicit locale and direction", () => {
    const html = renderToString(
      <TectonProvider locale="ar-EG" portalContainer={null}>
        <AriaBridge>
          <Probe />
        </AriaBridge>
      </TectonProvider>
    )
    expect(html).toBe(
      '<span data-locale="ar-EG" data-direction="rtl" data-base-ui="rtl" data-aria="ar-EG/rtl"></span>'
    )
  })
})
