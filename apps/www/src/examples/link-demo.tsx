import { Link } from "@tecton/react/tecton/link"

export default function LinkDemo() {
  return (
    <p className="max-w-md text-sm text-muted-foreground">
      The well design references{" "}
      <Link href="#" variant="primary">
        Alternative B
      </Link>{" "}
      as its base case. See the <Link href="#">FDA summary</Link> for the full
      comparison.
    </p>
  )
}
