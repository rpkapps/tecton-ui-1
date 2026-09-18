/**
 * What the guardrails must catch on a Tecton component, and what they must
 * leave alone. `pnpm --filter @tecton/eslint-config test` asserts both.
 *
 * Each violation carries an `// expect:` comment naming the rule that must
 * report on that line; every other line must come back clean.
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
      <Button className="bg-blue-600" /> {/* expect: tecton/no-restyle */}
      <Button className="h-12" /> {/* expect: tecton/no-restyle */}
      <Button className="rounded-full" /> {/* expect: tecton/no-restyle */}
      <Button className="p-6" /> {/* expect: tecton/no-restyle */}
      <Button className="text-[13px] " /> {/* expect: tecton/no-restyle */}
      {/* Stock palette: no CSS at all, and still a restyle of a Tecton component. */}
      <Button className="bg-red-500" /> {/* expect: tecton/no-restyle */}
      <Panel className="border-slate-200" /> {/* expect: tecton/no-restyle */}
      {/* Nothing can check a class assembled at runtime. */}
      <Button className={`bg-${String(1)}`} /> {/* expect: tecton/require-static-classes */}
    </>
  )
}
