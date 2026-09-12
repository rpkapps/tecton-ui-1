import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_site/blocks")({
  component: () => (
    <div className="container-wrapper flex flex-1 flex-col px-6">
      <div className="container flex flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  ),
})
