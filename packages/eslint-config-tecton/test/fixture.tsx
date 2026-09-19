/**
 * What the guardrails must catch on a Tecton component, and what they must
 * leave alone. `pnpm --filter @tecton/eslint-config test` asserts both.
 *
 * Each violation is preceded by an `expect:` comment naming the rules that
 * must report on the line below it, and the preset each one starts at; every
 * other line must come back clean. See scripts/smoke.mjs for the notation.
 */
import { Button } from "@tecton/react/components/button"
import { Panel } from "@tecton/react/tecton/panel"

export function Allowed() {
  return (
    <>
      {/* Layout composition: an application must be able to place a component. */}
      <Button className="w-full" />
      <Button className="mt-4" />
      <Button className="flex-1" />
      <Button className="absolute top-0" />
      <Button className="gap-2" />
      <Panel className="col-span-2" />
    </>
  )
}

export function Denied() {
  return (
    <>
      {/* The component owns its colour, shape, typography and size. */}
      {/* expect: shadcn/no-restyle */}
      {/* expect strict: shadcn/no-raw-colors */}
      <Button className="bg-blue-600" />
      {/* expect: shadcn/no-restyle */}
      <Button className="h-12" />
      {/* expect: shadcn/no-restyle */}
      <Button className="rounded-full" />
      {/* expect: shadcn/no-restyle */}
      <Button className="p-6" />
      {/* expect: shadcn/no-restyle */}
      {/* expect strict: shadcn/no-arbitrary-values */}
      <Button className="text-[13px]" />
      {/* Stock palette: no CSS at all, and still a restyle of a Tecton component. */}
      {/* expect: shadcn/no-restyle */}
      {/* expect strict: shadcn/no-raw-colors */}
      <Button className="bg-red-500" />
      {/* expect: shadcn/no-restyle */}
      {/* expect strict: shadcn/no-raw-colors */}
      <Panel className="border-slate-200" />
      {/* Nothing can check a class assembled at runtime. */}
      {/* expect: shadcn/require-static-classes */}
      <Button className={`bg-${String(1)}`} />
    </>
  )
}

/**
 * What `strict` is for. `no-restyle` lets layout through — an application must
 * be able to place a component — so these pass every rule in `recommended`,
 * and are caught only once the theme rules are on the component too.
 */
export function OffTheme() {
  return (
    <>
      {/* expect strict: shadcn/no-arbitrary-values */}
      <Button className="mt-[13px]" />
      {/* expect strict: shadcn/no-arbitrary-values */}
      <Panel className="grid-cols-[1fr_2fr]" />
      {/* A typo is unclassified, so both rules have something to say. */}
      {/* expect: shadcn/no-restyle */}
      {/* expect strict: shadcn/no-unknown-classes */}
      <Panel className="gap-huge" />
    </>
  )
}
