import { Link } from "@tecton/react/tecton/link"

export default function LinkSizes() {
  return (
    <div className="flex flex-wrap items-baseline gap-6">
      <Link href="#" size="sm">
        Small
      </Link>
      <Link href="#" size="md">
        Medium
      </Link>
      <Link href="#" size="lg">
        Large
      </Link>
      <span className="text-xl">
        Inherits{" "}
        <Link href="#" size="inherit" variant="subtle">
          the parent size
        </Link>
      </span>
    </div>
  )
}
