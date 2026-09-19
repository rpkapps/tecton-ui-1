/**
 * The scope guarantee: the presets a team reaches for look at Tecton
 * components only.
 *
 * An application's own components and its plain markup belong to the
 * application, not to the design system. Nothing in this file may be reported
 * under `recommended`, `strict` or `warn` — a guardrail that fires on someone
 * else's `<div>` is a guardrail they turn off.
 *
 * `project` is the deliberate opt-in that widens the theme rules to the whole
 * application, so the lines below are reported there and only there. That is
 * the whole difference between the two, and the smoke test holds both ends
 * of it.
 */
import * as React from "react"

function MyCard({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  return <div className={className}>{children}</div>
}

export function NotOurBusiness({ tone }: { tone: string }) {
  return (
    <>
      {/* plain markup */}
      {/* expect project: shadcn/no-raw-colors */}
      <div className="bg-red-500 h-12 rounded-full p-6" />
      {/* expect project: shadcn/no-arbitrary-values */}
      <span className="text-[13px]" />
      {/* expect project: shadcn/no-inline-styles */}
      <section style={{ color: "red" }} />
      {/* expect project: shadcn/no-unknown-classes */}
      <div className="gap-huge" />
      <div className={`bg-${tone}-500`} />
      {/* the application's own component */}
      {/* expect project: shadcn/no-raw-colors */}
      <MyCard className="bg-red-500 h-12 rounded-full">theirs</MyCard>
      {/* expect project: shadcn/no-arbitrary-values */}
      <MyCard className="text-[13px]">theirs</MyCard>
    </>
  )
}
