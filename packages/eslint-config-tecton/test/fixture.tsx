/**
 * Cases the guardrails must catch, and cases they must leave alone.
 * `pnpm --filter @tecton/eslint-config test` asserts both directions.
 *
 * Each violation carries an `// expect:` comment naming the rule that must
 * report on that line.
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
      {/* Real Tecton tokens. */}
      <Button className="gap-2" />
      <Panel className="col-span-2" />
    </>
  )
}

export function Denied() {
  return (
    <>
      <Button className="bg-blue-600" /> {/* expect: shadcn/no-restyle, shadcn/no-raw-colors */}
      <Button className="h-12" /> {/* expect: shadcn/no-restyle */}
      <Button className="rounded-full" /> {/* expect: shadcn/no-restyle */}
      <Button className="p-6" /> {/* expect: shadcn/no-restyle */}
      <Button className="text-[13px] " /> {/* expect: shadcn/no-restyle, shadcn/no-arbitrary-values */}
      {/* The silent failure: the stock palette is reset, so this emits no CSS. */}
      <Button className="bg-red-500" /> {/* expect: shadcn/no-restyle, shadcn/no-raw-colors */}
      <Panel className="border-slate-200" /> {/* expect: shadcn/no-restyle, shadcn/no-raw-colors */}
      <Button style={{ color: "red" }} /> {/* expect: shadcn/no-inline-styles */}
    </>
  )
}
