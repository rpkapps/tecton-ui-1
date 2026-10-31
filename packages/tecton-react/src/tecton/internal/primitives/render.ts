"use client"

/**
 * Internal to `@tecton/react`: how every primitive part renders, the Base UI
 * way. A part takes `render` (an element, or a function of the props and the
 * part's state), `className` and `style` as values or functions of the state,
 * and a `ref`; its state becomes presence `data-*` attributes
 * (`data-selected=""`), and the props it sets itself are merged with the
 * caller's (`mergeProps`: handlers chained, classes joined).
 */
import type * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"

type PrimitiveProps<
  TTag extends keyof React.JSX.IntrinsicElements,
  TState,
> = Omit<React.ComponentPropsWithRef<TTag>, "className" | "style"> & {
  /** A class, or a function returning one from the part's state. */
  className?: string | ((state: TState) => string | undefined)
  /** A style, or a function returning one from the part's state. */
  style?:
    | React.CSSProperties
    | ((state: TState) => React.CSSProperties | undefined)
  /** Replaces the element: an element, or a function of the props and state. */
  render?: useRender.RenderProp<TState>
}

type StateAttributes<TState> = {
  [K in keyof TState]?: (value: TState[K]) => Record<string, string> | null
}

function usePrimitive<
  TTag extends keyof React.JSX.IntrinsicElements,
  TState extends Record<string, unknown>,
>(
  tag: TTag,
  { render, className, style, ref, ...props }: PrimitiveProps<TTag, TState>,
  state: TState,
  ownProps: Record<string, unknown>,
  stateAttributesMapping?: StateAttributes<TState>
) {
  return useRender<TState, Element>({
    defaultTagName: tag,
    render,
    ref,
    state,
    stateAttributesMapping,
    props: mergeProps<TTag>(
      ownProps as never,
      {
        ...props,
        className: typeof className === "function" ? className(state) : className,
        style: typeof style === "function" ? style(state) : style,
      } as never
    ),
  })
}

/** Leaves a state key out of the `data-*` attributes. */
const hidden = () => null

export { usePrimitive, hidden }
export type { PrimitiveProps }
