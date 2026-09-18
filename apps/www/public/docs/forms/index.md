# Forms

Build forms with React Aria components and a headless form library.

Source: /docs/forms/index.md

The `<Field />` component family is the building block for forms: it gives you labels, descriptions, error messages and layout without owning the form state. Pair it with the form library of your choice.

<div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-6">
  
- [TanStack Form](/docs/forms/tanstack-form.md)

  
- [React Hook Form Upstream guide (Radix examples)](https://ui.shadcn.com/docs/forms/react-hook-form)

</div>

## Which one?

Tecton applications use **TanStack Form**: it is headless, framework-agnostic and shares the TanStack conventions of the router and table already in use. The guide covers every React Aria form control (input, textarea, select, checkbox, radio group, switch) and array fields.

The upstream React Hook Form guide applies as well; only the control props differ (see the [TanStack Form guide](/docs/forms/tanstack-form.md#working-with-different-field-types) for the React Aria equivalents of `onValueChange` / `onCheckedChange`).
