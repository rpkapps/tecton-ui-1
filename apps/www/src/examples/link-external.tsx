import { Link } from "@tecton/react/tecton/link"

export default function LinkExternal() {
  return (
    <div className="flex flex-wrap items-center gap-6 text-sm">
      <Link href="https://factpages.sodir.no" isExternal>
        Sodir FactPages
      </Link>
      <Link href="https://tanstack.com/table/latest" isExternal variant="muted">
        TanStack Table
      </Link>
    </div>
  )
}
