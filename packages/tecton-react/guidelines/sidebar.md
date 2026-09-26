---
component: Sidebar
module: "@tecton/react/components/sidebar"
family: navigation
exports: [Sidebar, SidebarProvider, SidebarTrigger, SidebarRail, SidebarInset, SidebarHeader, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuAction, SidebarMenuBadge, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton, useSidebar]
notFor:
  - need: a fixed navigation column inside the application frame
    use: AppShellSidebar
  - need: a panel that floats over the content and is dismissed
    use: Sheet
  - need: a hierarchy of folders and records expanded in place
    use: TreeView
related: [AppShell, Sheet, TreeView]
---

## Use it when

- The application's navigation rail: groups of destinations, an active row, a collapse control.
- The rail has to survive a phone — below the mobile breakpoint `Sidebar` renders itself as a `Sheet`.
- Rows carry a count, a per-row action or a second level of destinations.

## Do

- Wrap the rail, the content and every trigger in one `SidebarProvider`; `Sidebar`, `SidebarTrigger`, `SidebarRail` and `SidebarMenuButton` all call `useSidebar`, which throws outside it. The sidebar registers no keyboard shortcut: an application that wants one calls `toggleSidebar()` from `useSidebar()` in its own key handler.
- Render a row as `SidebarMenuItem` > `SidebarMenuButton`, with `render={<a href="/wells" />}` (or the router's `Link`) for a destination and `isActive` for the current one.
- Pick the behaviour with `collapsible="offcanvas" | "icon" | "none"` and the surface with `variant="sidebar" | "floating" | "inset"`.
- Treat `side="left" | "right"` as the physical edge: in a right-to-left layout pass `side="right"` (from `useDirection()`) to keep the sidebar at the start; the border, the rail and the collapsed tooltips follow the side.
- Pass `tooltip="Wells"` (or `TooltipContent` props) on `SidebarMenuButton`: it shows only while the rail is icon-collapsed, which is exactly when the label is gone.

## Don't

### HIGH A navigation row built as a button with a handler

Wrong:

```tsx
<SidebarMenuItem>
  <SidebarMenuButton onClick={() => navigate("/wells")}>Wells</SidebarMenuButton>
</SidebarMenuItem>
```

Correct:

```tsx
<SidebarMenuItem>
  <SidebarMenuButton render={<a href="/wells" />} isActive={pathname === "/wells"}>Wells</SidebarMenuButton>
</SidebarMenuItem>
```

`SidebarMenuButton` renders a `button` unless `render` makes it an anchor, so the row is no destination for middle-click, Cmd-click or "copy link address", and screen readers announce a button rather than a link.

### HIGH Two providers sharing one cookie

Wrong:

```tsx
<SidebarProvider>
  <AssetTrackerSidebar />
</SidebarProvider>
```

Correct:

```tsx
<SidebarProvider cookieName="asset_tracker_sidebar">
  <AssetTrackerSidebar />
</SidebarProvider>
```

Every `SidebarProvider` writes the `sidebar_state` cookie by default, so a rail mounted beside the shell's own overwrites the state both of them restore from.

### MEDIUM A hand-built Sheet for the mobile rail

Wrong:

```tsx
const isMobile = useIsMobile()
return isMobile ? (
  <Sheet open={open} onOpenChange={setOpen}>
    <SheetContent side="left"><SidebarMenu>{rows}</SidebarMenu></SheetContent>
  </Sheet>
) : (
  <Sidebar>
    <SidebarContent>{rows}</SidebarContent>
  </Sidebar>
)
```

Correct:

```tsx
<Sidebar collapsible="offcanvas">
  <SidebarContent>
    <SidebarMenu>{rows}</SidebarMenu>
  </SidebarContent>
</Sidebar>
```

`Sidebar` already swaps itself for a `Sheet` bound to the provider's `openMobile` state below the mobile breakpoint, so the hand-built branch is a second one and `SidebarTrigger`, which toggles that state, now opens nothing.
