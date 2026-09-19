# Component index — `@tecton/react/components/*`

Every component below is the shadcn/ui implementation on the **React Aria**
base (`react-aria-components`), installed by the shadcn CLI from the
`aria-tecton` style. Import each from its own module:

```tsx
import { Button } from "@tecton/react/components/button"
```

Read `../SKILL.md` first for the prop conventions — this table lists what
exists, not how React Aria differs from Radix.

**Reading the table.** *Exports* is the full public surface of the module; if
a name you expect is missing (`DialogContent`, `DropdownMenuContent`,
`SelectPortal`), it does not exist and the Radix composition you have in mind
does not apply. *Variant axes* are the props to reach for instead of
`className` — the first value listed is the default.

| Module | Exports | Variant axes |
| --- | --- | --- |
| `accordion` | Accordion, AccordionItem, AccordionTrigger, AccordionContent | — |
| `alert-dialog` | AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogOverlay, AlertDialogTitle, AlertDialogTrigger | — |
| `alert` | Alert, AlertTitle, AlertDescription, AlertAction | variant: default / destructive / success / warning / info<br>appearance: default / outline / filled |
| `aspect-ratio` | AspectRatio | — |
| `attachment` | Attachment, AttachmentGroup, AttachmentMedia, AttachmentContent, AttachmentTitle, AttachmentDescription, AttachmentActions, AttachmentAction, AttachmentTrigger | size: default / sm / xs<br>orientation: horizontal / vertical<br>variant: icon / image |
| `avatar` | Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarBadge | — |
| `badge` | Badge | variant: default / secondary / destructive / outline / ghost / link / success / warning / info<br>appearance: solid / outline<br>size: default / md / lg |
| `breadcrumb` | Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbEllipsis | — |
| `bubble` | BubbleGroup, Bubble, BubbleContent, BubbleReactions | variant: default / secondary / muted / tinted / outline / ghost / destructive<br>side: top / bottom<br>align: start / end |
| `button-group` | ButtonGroup, ButtonGroupSeparator, ButtonGroupText | orientation: horizontal / vertical |
| `button` | Button, LinkButton | variant: default / hover / outline / secondary / ghost / destructive / link<br>size: default / xs / sm / lg / icon / icon-xs / icon-sm / icon-lg |
| `calendar` | Calendar, RangeCalendar | showWeekNumber: false / true<br>isToday: true<br>isSelectionStart: true<br>isSelectionEnd: true<br>isUnavailable: true<br>isDisabled: true<br>isOutsideMonth: true |
| `card` | Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent | — |
| `carousel` | Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext | — |
| `chart` | ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle | — |
| `checkbox` | Checkbox | — |
| `collapsible` | Collapsible, CollapsibleTrigger, CollapsibleContent | — |
| `combobox` | ComboBoxPrimitive as Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxGroup, ComboboxLabel, Collection as ComboboxCollection, ComboboxEmpty, ComboboxSeparator, ComboboxChips, ComboboxChip, ComboboxChipList, ComboboxChipsInput, ComboboxTrigger, ComboboxValue | — |
| `command` | Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut, CommandSeparator | — |
| `context-menu` | ContextMenu, ContextMenuTrigger, ContextMenuItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuShortcut, ContextMenuGroup, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger | selectionMode: none / single / multiple |
| `dialog` | Dialog, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogTitle, DialogTrigger | — |
| `direction` | DirectionProvider, I18nProvider | — |
| `drawer` | Drawer, DrawerPortal, DrawerOverlay, DrawerSwipeHandle, DrawerTrigger, DrawerClose, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription | — |
| `dropdown-menu` | DropdownMenuTrigger, DropdownMenu, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent | selectionMode: none / single / multiple |
| `empty` | Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia | variant: default / icon |
| `field` | Field, FieldLabel, FieldDescription, FieldError, FieldGroup, FieldLegend, FieldSeparator, FieldSet, FieldContent, FieldTitle | orientation: vertical / horizontal / responsive |
| `hover-card` | HoverCard, HoverCardTrigger | — |
| `input-group` | InputGroup, InputGroupAddon, InputGroupButton, InputGroupText, InputGroupInput, InputGroupTextarea | align: inline-start / inline-end / block-start / block-end<br>size: xs / sm / icon-xs / icon-sm |
| `input-otp` | InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator | — |
| `input` | Input | variant: outline / filled / text |
| `item` | Item, ItemMedia, ItemContent, ItemActions, ItemGroup, ItemSeparator, ItemTitle, ItemDescription, ItemHeader, ItemFooter | variant: default / icon / image<br>size: default / sm / xs |
| `kbd` | Kbd, KbdGroup | — |
| `label` | Label | — |
| `marker` | Marker, MarkerIcon, MarkerContent | variant: default / separator / before / border |
| `message-scroller` | MessageScrollerProvider, MessageScroller, MessageScrollerViewport, MessageScrollerContent, MessageScrollerItem, MessageScrollerButton | — |
| `message` | MessageGroup, Message, MessageAvatar, MessageContent, MessageFooter, MessageHeader | — |
| `native-select` | NativeSelect, NativeSelectOptGroup, NativeSelectOption | — |
| `pagination` | Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious | — |
| `popover` | Popover, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger | — |
| `progress` | Progress, ProgressTrack, ProgressIndicator, ProgressLabel, ProgressValue | — |
| `questionnaire` | Questionnaire, QuestionnaireActions, QuestionnaireChoice, QuestionnaireChoiceDescription, QuestionnaireChoices, QuestionnaireDescription, QuestionnaireError, QuestionnaireInput, QuestionnaireItem, QuestionnaireNext, QuestionnairePrevious, QuestionnaireProgress, QuestionnaireSkip, QuestionnaireSubmit, QuestionnaireTitle | — |
| `radio-group` | RadioGroup, RadioGroupItem | — |
| `resizable` | ResizableHandle, ResizablePanel, ResizablePanelGroup | — |
| `scroll-area` | ScrollArea | — |
| `select` | Select, SelectContent, SelectGroup, SelectInput, SelectItem, SelectLabel, SelectList, SelectPopover, SelectSeparator, SelectTrigger, SelectValue, SelectEmpty | — |
| `separator` | Separator | emphasis: subtle / default / strong |
| `sheet` | Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription | — |
| `sidebar` | Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInput, SidebarInset, SidebarMenu, SidebarMenuAction, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSkeleton, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider, SidebarRail, SidebarSeparator, SidebarTrigger | variant: default / outline<br>size: default / sm / lg |
| `skeleton` | Skeleton | — |
| `slider` | Slider | — |
| `sonner` | Toaster | — |
| `spinner` | Spinner | — |
| `switch` | Switch | — |
| `table` | Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption | — |
| `tabs` | Tabs, TabsList, TabsTrigger, TabsContent | variant: default / line |
| `textarea` | Textarea | variant: outline / filled / text |
| `toggle-group` | ToggleGroup, ToggleGroupItem | — |
| `toggle` | Toggle | variant: default / outline<br>size: default / sm / lg |
| `tooltip` | Tooltip, TooltipTrigger | — |
## Not in this directory

| You want | It is |
| --- | --- |
| `Chip`, `CountBadge`, `Stat`, `Panel`, `PageHeader`, `AppShell`, `TreeView`, `Meter`, `CircularProgress`, `ColorSwatch`, `CopyButton`, `Link`, `ActionBar`, `Canvas`, `Overflow`, `Shortcuts`, `AppFinder`, `Background`, `Portal`, `ShellActions` | `@tecton/react/tecton/<name>` — see `tecton-core/tecton-components` |
| An icon | `@tecton/react/icons` — see `tecton-core/icons` |
| A whole screen | a block — see `tecton-core/blocks` |
| `menubar`, `navigation-menu`, `toast` | Not in the React Aria registry. Use `DropdownMenu`, `Sidebar`/`Tabs` and `sonner` respectively. |
| A data table | `Table` + TanStack Table — see `tecton-core/data-tables` |
| A date picker | `Calendar` inside a `Popover` — see the docs site `/docs/components/date-picker` |
