import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_site/blocks")({
  component: () => (
    <div className="container-wrapper flex flex-1 flex-col px-6 py-8 md:py-10">
      <Outlet />
    </div>
  ),
})
