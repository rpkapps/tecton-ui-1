import * as React from "react"
import { cn } from "cn"
import {
  DisclosurePanel as AccordionContentPrimitive,
  Heading as AccordionHeaderPrimitive,
  Disclosure as AccordionItemPrimitive,
  DisclosureGroup as AccordionPrimitive,
  Button as AccordionTriggerPrimitive,
  type ButtonProps,
  type DisclosureGroupProps,
  type DisclosurePanelProps,
  type DisclosureProps,
} from "react-aria-components"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"

function Accordion({ className, ...props }: DisclosureGroupProps) {
  return (
    <AccordionPrimitive
      data-slot="accordion"
      className={cn("flex w-full flex-col rounded-md", className)}
      {...props}
    />
  )
}

function AccordionItem({ className, ...props }: DisclosureProps) {
  return (
    <AccordionItemPrimitive
      data-slot="accordion-item"
      className={cn(
        "*:rounded-[inherit] not-last:border-b first:rounded-t-[inherit] last:rounded-b-[inherit]",
        className
      )}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: Omit<ButtonProps, "children"> & { children: React.ReactNode }) {
  return (
    <AccordionHeaderPrimitive className="flex">
      <AccordionTriggerPrimitive
        slot="trigger"
        data-slot="accordion-trigger"
        className={cn(
          "text-ghost-foreground hover:bg-ghost-hover hover:text-ghost-hover-foreground focus-visible:bg-ghost-hover focus-visible:text-ghost-hover-foreground data-pressed:bg-ghost-pressed data-pressed:text-ghost-pressed-foreground aria-expanded:bg-ghost-active aria-expanded:text-ghost-active-foreground **:data-[slot=accordion-trigger-icon]:text-link-foreground group/accordion-trigger relative flex flex-1 items-start justify-between rounded-none border border-transparent px-2 py-1.5 text-left text-sm font-normal transition-all outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:after:border-ring disabled:pointer-events-none disabled:opacity-50 in-[[data-slot=accordion-item]:first-child]:rounded-t-[inherit] in-[[data-slot=accordion-item]:last-child]:not-aria-expanded:rounded-b-[inherit] **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-5",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon data-slot="accordion-trigger-icon" className="pointer-events-none shrink-0 group-aria-expanded/accordion-trigger:hidden" />
        <ChevronUpIcon data-slot="accordion-trigger-icon" className="pointer-events-none hidden shrink-0 group-aria-expanded/accordion-trigger:inline" />
      </AccordionTriggerPrimitive>
    </AccordionHeaderPrimitive>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: DisclosurePanelProps) {
  return (
    <AccordionContentPrimitive
      data-slot="accordion-content"
      className="h-(--disclosure-panel-height) overflow-clip text-sm text-muted-foreground transition-[height] data-open:animate-accordion-down data-closed:animate-accordion-up"
      {...props}
    >
      <div
        className={cn(
          "px-2 pt-1.5 pb-3 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
          className
        )}
      >
        {children}
      </div>
    </AccordionContentPrimitive>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
