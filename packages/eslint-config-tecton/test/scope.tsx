/**
 * The scope guarantee: `recommended` looks at Tecton components only.
 *
 * An application's own components and its plain markup belong to the
 * application, not to the design system. Nothing in this file may be reported —
 * the smoke test fails on any error here, because a guardrail that fires on
 * someone else's `<div>` is a guardrail they turn off.
 *
 * Teams that do want every class in the project checked against the Tecton
 * theme opt into `tecton.configs.strict`, which adds the project-wide rules.
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
      <div className="bg-red-500 h-12 rounded-full p-6" />
      <span className="text-[13px]" />
      <section style={{ color: "red" }} />
      <div className={`bg-${tone}-500`} />
      {/* the application's own component */}
      <MyCard className="bg-red-500 h-12 rounded-full">theirs</MyCard>
      <MyCard className="text-[13px]">theirs</MyCard>
    </>
  )
}
