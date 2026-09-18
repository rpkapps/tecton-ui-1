# Components

The 60 shadcn/ui components of the React Aria base, unchanged and themed through the Tecton tokens.

Source: /docs/components/index.md

These pages are the shadcn/ui documentation for the React Aria base, synced from upstream and adjusted for `@tecton/react` imports. The components are what the shadcn CLI generates for the React Aria base with the Tecton style overlay: the same names, props and composition as upstream, plus the variants Tecton needs — status colours and appearances on `Alert` and `Badge`, `emphasis` on `Separator`, the outline / filled / text surfaces on `Input`, `Textarea` and `Select`, and the Tecton hover and pressed colours on `Button`. Each page documents those additions in a Tecton section that the docs sync inserts before the API reference.

> **One import**
>
> Every component is imported from the package: `import { Button } from "@tecton/react/components/button"`. There is nothing to install per component; see [Installation](/docs/installation.md) for adding the package to an application.

- [Accordion](/docs/components/accordion.md) — A vertically stacked set of interactive headings that each reveal a section of content.
- [Alert](/docs/components/alert.md) — Displays a callout for user attention.
- [Alert Dialog](/docs/components/alert-dialog.md) — A modal dialog that interrupts the user with important content and expects a response.
- [Aspect Ratio](/docs/components/aspect-ratio.md) — Displays content within a desired ratio.
- [Attachment](/docs/components/attachment.md) — Displays a file or image attachment with media, metadata, upload state, and actions.
- [Avatar](/docs/components/avatar.md) — An image element with a fallback for representing the user.
- [Badge](/docs/components/badge.md) — Displays a badge or a component that looks like a badge.
- [Breadcrumb](/docs/components/breadcrumb.md) — Displays the path to the current resource using a hierarchy of links.
- [Bubble](/docs/components/bubble.md) — Displays conversational content in a message bubble. Supports variants, alignment, grouping, reactions, and collapsible content.
- [Button](/docs/components/button.md) — Displays a button or a component that looks like a button.
- [Button Group](/docs/components/button-group.md) — A container that groups related buttons together with consistent styling.
- [Calendar](/docs/components/calendar.md) — A calendar component that allows users to select a date or a range of dates.
- [Card](/docs/components/card.md) — Displays a card with header, content, and footer.
- [Carousel](/docs/components/carousel.md) — A carousel with motion and swipe built using Embla.
- [Chart](/docs/components/chart.md) — Beautiful charts. Built using Recharts. Copy and paste into your apps.
- [Checkbox](/docs/components/checkbox.md) — A control that allows the user to toggle between checked and not checked.
- [Collapsible](/docs/components/collapsible.md) — An interactive component which expands/collapses a panel.
- [Combobox](/docs/components/combobox.md) — Autocomplete input with a list of suggestions.
- [Command](/docs/components/command.md) — Command menu for search and quick actions.
- [Context Menu](/docs/components/context-menu.md) — Displays a menu of actions triggered by a right click.
- [Data Table](/docs/components/data-table.md) — Powerful table and datagrids built using TanStack Table.
- [Date Picker](/docs/components/date-picker.md) — A date picker component with range and presets.
- [Dialog](/docs/components/dialog.md) — A window overlaid on either the primary window or another dialog window, rendering the content underneath inert.
- [Direction](/docs/components/direction.md) — A provider component that sets the text direction for your application.
- [Drawer](/docs/components/drawer.md) — A drawer component for React.
- [Dropdown Menu](/docs/components/dropdown-menu.md) — Displays a menu to the user — such as a set of actions or functions — triggered by a button.
- [Empty](/docs/components/empty.md) — Use the Empty component to display an empty state.
- [Field](/docs/components/field.md) — Combine labels, controls, and help text to compose accessible form fields and grouped inputs.
- [Hover Card](/docs/components/hover-card.md) — A popover that appears on hover, focus, or long press to preview content available behind a link.
- [Input](/docs/components/input.md) — A text input component for forms and user data entry with built-in styling and accessibility features.
- [Input Group](/docs/components/input-group.md) — Add addons, buttons, and helper content to inputs.
- [Input OTP](/docs/components/input-otp.md) — Accessible one-time password component with copy paste functionality.
- [Item](/docs/components/item.md) — A versatile component for displaying content with media, title, description, and actions.
- [Kbd](/docs/components/kbd.md) — Used to display textual user input from keyboard.
- [Label](/docs/components/label.md) — Renders an accessible label associated with controls.
- [Marker](/docs/components/marker.md) — Displays an inline status, system note, bordered row, or labeled separator in a conversation.
- [Message](/docs/components/message.md) — Displays a message in a conversation, with optional avatar, header, footer, and alignment.
- [Message Scroller](/docs/components/message-scroller.md) — A chat scroll container that anchors turns, opens saved transcripts, follows streamed responses, loads history without jumping, and jumps to any message.
- [Native Select](/docs/components/native-select.md) — A styled native HTML select element with consistent design system integration.
- [Pagination](/docs/components/pagination.md) — Pagination with page navigation, next and previous links.
- [Popover](/docs/components/popover.md) — Displays rich content in a portal, triggered by a button.
- [Progress](/docs/components/progress.md) — Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.
- [Questionnaire](/docs/components/questionnaire.md) — A multi-step questionnaire with single-choice, multiple-choice, freeform, and skippable questions.
- [Radio Group](/docs/components/radio-group.md) — A set of checkable buttons—known as radio buttons—where no more than one of the buttons can be checked at a time.
- [Resizable](/docs/components/resizable.md) — Accessible resizable panel groups and layouts with keyboard support.
- [Scroll Area](/docs/components/scroll-area.md) — Augments native scroll functionality for custom, cross-browser styling.
- [Select](/docs/components/select.md) — Displays a list of options for the user to pick from—triggered by a button.
- [Separator](/docs/components/separator.md) — Visually or semantically separates content.
- [Sheet](/docs/components/sheet.md) — Extends the Dialog component to display content that complements the main content of the screen.
- [Sidebar](/docs/components/sidebar.md) — A composable, themeable and customizable sidebar component.
- [Skeleton](/docs/components/skeleton.md) — Use to show a placeholder while content is loading.
- [Slider](/docs/components/slider.md) — An input where the user selects a value from within a given range.
- [Sonner](/docs/components/sonner.md) — An opinionated toast component for React.
- [Spinner](/docs/components/spinner.md) — An indicator that can be used to show a loading state.
- [Switch](/docs/components/switch.md) — A control that allows the user to toggle between checked and not checked.
- [Table](/docs/components/table.md) — A responsive table component.
- [Tabs](/docs/components/tabs.md) — A set of layered sections of content—known as tab panels—that are displayed one at a time.
- [Textarea](/docs/components/textarea.md) — Displays a form textarea or a component that looks like a textarea.
- [Toggle](/docs/components/toggle.md) — A two-state button that can be either on or off.
- [Toggle Group](/docs/components/toggle-group.md) — A set of two-state buttons that can be toggled on or off.
- [Tooltip](/docs/components/tooltip.md) — A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.
