import { Link } from "@tanstack/react-router"

import { buttonVariants } from "@tecton/react/components/button"

/** The 404 page inside the site chrome (header, sidebar, footer). */
export function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-2xl font-medium">404</h1>
      <p className="text-muted-foreground">
        The requested page could not be found.
      </p>
      <Link
        to="/docs"
        className={buttonVariants({ variant: "secondary", size: "sm" })}
      >
        Go to the documentation
      </Link>
    </div>
  )
}
