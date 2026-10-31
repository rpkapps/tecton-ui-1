"use client"

import * as React from "react"

import { useTranslations } from "../../i18n/translations"
import { useStore } from "../../store"
import { hidden, usePrimitive, type PrimitiveProps } from "../render"
import type { DragAndDrop, DragMode } from "./use-drag-and-drop"

/** Visually hidden, yet focusable and read by assistive technology. */
const SR_ONLY: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
  border: 0,
}

type DragHandleState = { dragging: boolean }

type DragHandleProps = PrimitiveProps<"button", DragHandleState> & {
  dragAndDrop: DragAndDrop<unknown>
  /** The key of the item the handle drags. */
  value: string
  /** The item's name: the handle is named "Drag {label}". */
  label: string
}

/**
 * The drag handle of an item: a press and move drags it (a finger at once,
 * where elsewhere on the item it waits for a long press), Enter or Space
 * starts a keyboard drag, and a screen reader's activation a virtual one.
 * Reached with the arrow keys from its item, not with Tab.
 */
function DragHandle({ dragAndDrop, value, label, ...props }: DragHandleProps) {
  const dragging = useStore(dragAndDrop.store, (s) =>
    s.dragging.includes(value)
  )
  // Its own subscription: rows are memoized, and must still re-render when
  // the locale's translations arrive.
  const t = useTranslations("dragAndDrop")
  return usePrimitive(
    "button",
    props,
    { dragging },
    {
      type: "button",
      tabIndex: -1,
      "aria-label": t("dragItem", { itemText: label }),
      style: { touchAction: "none" },
      onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
        dragAndDrop.onPointerDown(event, value, { handle: true })
        // The item's own press handling must not start a second drag.
        event.stopPropagation()
      },
      onKeyDown: (event: React.KeyboardEvent<HTMLElement>) =>
        dragAndDrop.onHandleKeyDown(event, value),
      onClick: (event: React.MouseEvent<HTMLElement>) =>
        dragAndDrop.onHandleClick(event, value),
    },
    { dragging: hidden }
  )
}

type DropIndicatorState = {
  /** Whether a drop is aimed between items (the line shows). */
  visible: boolean
  mode: DragMode | null
}

type DropIndicatorProps<TPlace> = PrimitiveProps<"div", DropIndicatorState> & {
  dragAndDrop: DragAndDrop<TPlace>
  /**
   * Where the line goes for `place` (`null` hides it: a drop inside an item
   * shows on the item).
   */
  getPlacement: (place: TPlace) => React.CSSProperties | null
  /** The drop targets are rows of a grid (a tree, a grid list). */
  grid?: boolean
}

/**
 * Shows where a drop will go: a line between items, placed by
 * `getPlacement`. During a keyboard drag the aimed place is also a focused
 * drop target named after it ("Insert between Wells and Notes"), one per
 * place so each step is read; during a virtual drag, every place is a
 * button.
 */
function DropIndicator<TPlace>({
  dragAndDrop,
  getPlacement,
  grid = false,
  ...props
}: DropIndicatorProps<TPlace>) {
  const { store } = dragAndDrop
  const mode = useStore(store, (s) => s.mode)
  const aimed = useStore(store, (s) => s.aimed)
  const places = useStore(store, (s) => s.places)
  const placement = aimed === null ? null : getPlacement(aimed)

  const line = usePrimitive(
    "div",
    props,
    { visible: placement !== null, mode },
    {
      "aria-hidden": true,
      hidden: placement === null,
      style: { position: "absolute", pointerEvents: "none", ...placement },
    },
    { mode: hidden }
  )

  const wrap = (children: React.ReactNode) =>
    grid ? (
      <div role="row" style={SR_ONLY} ref={dragAndDrop.registerTargets}>
        <div role="gridcell">{children}</div>
      </div>
    ) : (
      <div style={SR_ONLY} ref={dragAndDrop.registerTargets}>
        {children}
      </div>
    )

  let targets: React.ReactNode = null
  if (mode === "keyboard" && aimed !== null) {
    const label = dragAndDrop.label(aimed)
    targets = wrap(
      <div
        key={label}
        role="button"
        tabIndex={-1}
        aria-label={label}
        ref={(element) => element?.focus({ preventScroll: true })}
      />
    )
  } else if (mode === "virtual") {
    targets = wrap(
      places.map((place, index) => (
        <button
          key={index}
          type="button"
          aria-label={dragAndDrop.label(place)}
          ref={
            index === 0
              ? (element) => element?.focus({ preventScroll: true })
              : undefined
          }
          onClick={() => dragAndDrop.drop(place)}
        />
      ))
    )
  }

  return (
    <>
      {line}
      {targets}
    </>
  )
}

export { DragHandle, DropIndicator }
export type {
  DragHandleProps,
  DragHandleState,
  DropIndicatorProps,
  DropIndicatorState,
}
