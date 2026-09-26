import { Link } from "@tecton/react/tecton/link"

export default function LinkExternal() {
  return (
    <div className="flex flex-wrap items-center gap-6 text-sm">
      <Link href="https://factpages.sodir.no" external>
        Sodir FactPages
      </Link>
      <Link href="https://www.sodir.no" external variant="muted">
        Norwegian Offshore Directorate
      </Link>
    </div>
  )
}
