import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

import { Separator } from "@tecton/react/components/separator"

const buttonGroupVariants = cva(
  "[&:has(>[data-variant=outline],>[data-slot=input],>[data-slot=textarea],>[data-slot=select-trigger],>[data-slot=input-group],>[data-slot=button-group-text])>[data-slot=button]:not([data-variant=outline])]:border-outline-border flex w-fit items-stretch *:focus-visible:relative *:focus-visible:z-10 has-[>[data-slot=button-group]]:gap-2 [&_[data-slot]:is(:hover,:focus-within,[data-pressed],[aria-expanded=true],[aria-invalid=true])]:relative [&_[data-slot]:is(:hover,:focus-within,[data-pressed],[aria-expanded=true],[aria-invalid=true])]:z-10 has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-e-md [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1",
  {
    variants: {
      orientation: {
        horizontal:
          "**:data-slot:rounded-e-none [&_[data-slot]~[data-slot]]:rounded-s-none [&_[data-slot]~[data-slot]:not([data-slot=button-group])]:-ms-px [&>[data-slot]:not(:has(~[data-slot]))]:rounded-e-md!",
        vertical:
          "flex-col **:data-slot:rounded-b-none [&_[data-slot]~[data-slot]]:rounded-t-none [&_[data-slot]~[data-slot]:not([data-slot=button-group])]:-mt-px [&>[data-slot]:not(:has(~[data-slot]))]:rounded-b-md!",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  }
)

function ButtonGroup({
  className,
  orientation,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof buttonGroupVariants>) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  )
}

function ButtonGroupText({
  className,
  render,
  ...props
}: React.ComponentProps<"div"> & {
  render?: (props: React.HTMLAttributes<HTMLElement>) => React.ReactNode
}) {
  if (render) {
    const renderProps = {
      "data-slot": "button-group-text",
      className: cn(
        "flex items-center gap-2 rounded-md border bg-muted px-2.5 text-sm font-medium [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      ...props,
    }

    return render(renderProps)
  }

  return (
    <div
      data-slot="button-group-text"
      className={cn(
        "flex items-center gap-2 rounded-md border bg-muted px-2.5 text-sm font-medium [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn(
        "relative self-stretch bg-input data-horizontal:mx-px data-horizontal:w-auto data-vertical:my-px data-vertical:h-auto",
        className
      )}
      {...props}
    />
  )
}

export {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  buttonGroupVariants,
}
