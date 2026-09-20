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

- Wrap the rail, the content and every trigger in one `SidebarProvider`; `Sidebar`, `SidebarTrigger`, `SidebarRail` and `SidebarMenuButton` all call `useSidebar`, which throws outside it.
- Render a row as `SidebarMenuItem` > `SidebarMenuButton`, with `href` for a destination and `isActive` for the current one.
- Pick the behaviour with `collapsible="offcanvas" | "icon" | "none"` and the surface with `variant="sidebar" | "floating" | "inset"`.
- Pass `tooltip="Wells"` on `SidebarMenuButton`: it shows only while the rail is icon-collapsed, which is exactly when the label is gone.

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
  <SidebarMenuButton href="/wells" isActive={pathname === "/wells"}>Wells</SidebarMenuButton>
</SidebarMenuItem>
```

`SidebarMenuButton` renders a React Aria `Link` only when it is given an `href`; without one it is a `button`, so the row is no destination for middle-click, Cmd-click or "copy link address", and `onClick` survives only as React Aria's deprecated press alias.

### HIGH Two providers sharing one cookie and one ⌘B

Wrong:

```tsx
<SidebarProvider>
  <AssetTrackerSidebar />
</SidebarProvider>
```

Correct:

```tsx
<SidebarProvider cookieName="asset_tracker_sidebar" keyboardShortcut={false}>
  <AssetTrackerSidebar />
</SidebarProvider>
```

Every `SidebarProvider` writes the `sidebar_state` cookie and adds a `window` keydown listener for ⌘B / Ctrl+B by default, so a rail mounted beside the shell's own overwrites the state both of them restore from and one key press toggles the pair.

### MEDIUM A hand-built Sheet for the mobile rail

Wrong:

```tsx
const isMobile = useIsMobile()
return isMobile ? (
  <Sheet isOpen={isOpen} onOpenChange={setIsOpen} side="left">
    <SidebarMenu>{rows}</SidebarMenu>
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
