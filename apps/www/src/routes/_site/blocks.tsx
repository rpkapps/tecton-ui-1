import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_site/blocks")({
  component: () => (
    <div className="mx-auto flex w-full max-w-(--breakpoint-2xl) flex-1 flex-col px-4 py-8 md:px-6 md:py-10">
      <Outlet />
    </div>
  ),
})
