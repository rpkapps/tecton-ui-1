/**
 * The behaviour primitives and shared types the Tecton components are composed
 * from, re-exported so an application never imports the behaviour layer
 * directly.
 *
 * Some Tecton compositions cannot be expressed with components alone: a context
 * menu needs a pressable trigger around arbitrary markup, a searchable select
 * needs a filter around its list, and controlled selection or range props need
 * their types named. Those pieces are part of the public surface of
 * `@tecton/react`, so they live here rather than sending consumers to the
 * library underneath — which is an implementation detail they must be able to
 * ignore, and which the design system is free to change.
 *
 * Only add what a documented Tecton composition actually requires. This is not
 * a general-purpose re-export of the base library.
 */
export {
  /** Makes arbitrary markup a press target — the child of a `ContextMenuTrigger`. */
  Pressable,
  /** Filters the list of a `Select` or `Command` as the user types. */
  Autocomplete,
  /** Locale-aware string matchers (`contains`, `startsWith`) for `Autocomplete`. */
  useFilter,
} from "react-aria-components"

export type {
  /** Identity of a collection item — `SelectItem`, `Chip`, `TreeViewItem`… */
  Key,
  /** Controlled selection of a multi-select collection: a `Set` of keys or `"all"`. */
  Selection,
  /** Controlled value of a range `Calendar` or `DatePicker`. */
  DateRange,
} from "react-aria-components"
