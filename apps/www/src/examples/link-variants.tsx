import { Link } from "@tecton/react/tecton/link"

export default function LinkVariants() {
  return (
    <div className="flex flex-wrap items-center gap-6 text-sm">
      <Link href="#" variant="default">
        Default
      </Link>
      <Link href="#" variant="primary">
        Primary
      </Link>
      <Link href="#" variant="muted">
        Muted
      </Link>
      <Link href="#" variant="subtle">
        Subtle
      </Link>
      <Link href="#" isDisabled>
        Disabled
      </Link>
    </div>
  )
}
