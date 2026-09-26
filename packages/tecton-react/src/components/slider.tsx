"use client"

import { cn } from "cn"
import {
  SliderFill,
  Slider as SliderPrimitive,
  SliderThumb,
  SliderTrack,
  type SliderProps as SliderPrimitiveProps,
} from "react-aria-components"

type SliderValue = number | number[]
type SliderProps<T extends SliderValue = SliderValue> = Omit<
  SliderPrimitiveProps<T>,
  "className"
> & {
  className?: string
}

function Slider<T extends SliderValue = SliderValue>({
  className,
  ...props
}: SliderProps<T>) {
  return (
    <SliderPrimitive
      className={cn(
        "group relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col",
        className
      )}
      data-slot="slider"
      {...props}
    >
      {({ state }) => {
        return (
          <>
            <SliderTrack
              data-slot="slider-track"
              className="bg-slider/60 relative grow overflow-hidden rounded-full select-none data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1"
            >
              <SliderFill
                data-slot="slider-range"
                className="bg-slider absolute select-none data-horizontal:h-full data-vertical:w-full"
              />
            </SliderTrack>
            {state.values.map((_, index) => (
              <SliderThumb
                data-slot="slider-thumb"
                key={index}
                index={index}
                className="bg-slider ring-slider/30 block size-5 shrink-0 rounded-full transition-[color,box-shadow] select-none group-data-horizontal:top-[50%] group-data-vertical:left-[50%] hover:ring-4 data-focus-visible:ring-2 data-focus-visible:ring-ring data-disabled:pointer-events-none"
              />
            ))}
          </>
        )
      }}
    </SliderPrimitive>
  )
}

export { Slider }
