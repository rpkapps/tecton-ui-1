// Local stand-in for apps/v4/app/(app)/(create)/init/route.ts.
// Usage: bun run scripts/local-init.mts "<query string>"  -> prints registry item JSON.
import { registryItemSchema } from "shadcn/schema"
import {
  buildPartialRegistryBase,
  buildRegistryBase,
  parseRegistryBaseParts,
} from "@/registry/config"
import { parseDesignSystemConfig } from "@/app/(app)/(create)/lib/parse-config"

const searchParams = new URLSearchParams(process.argv[2] ?? "")
const result = parseDesignSystemConfig(searchParams)
if (!result.success) {
  console.error(JSON.stringify({ error: result.error }))
  process.exit(2)
}
const onlyResult = parseRegistryBaseParts(searchParams.get("only"))
if (!onlyResult.success) {
  console.error(JSON.stringify({ error: onlyResult.error }))
  process.exit(2)
}
const registryBase = onlyResult.parts
  ? buildPartialRegistryBase(result.data, onlyResult.parts)
  : buildRegistryBase(result.data)
const parsed = registryItemSchema.safeParse(registryBase)
if (!parsed.success) {
  console.error(JSON.stringify({ error: "Invalid registry base item", details: parsed.error.format() }))
  process.exit(2)
}
process.stdout.write(JSON.stringify(parsed.data))
