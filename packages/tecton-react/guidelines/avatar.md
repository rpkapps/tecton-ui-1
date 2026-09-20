---
component: Avatar
module: "@tecton/react/components/avatar"
family: presentation
exports: [Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarBadge]
notFor:
  - need: a glyph that stands for a thing rather than a person
    use: Tecton icons
  - need: a colour value shown as a square
    use: ColorSwatch
  - need: a number pinned to the corner of an icon
    use: CountBadge
  - need: a person tag the user can select or remove
    use: Chip
related: [CountBadge, ColorSwatch, Chip]
---

## Use it when

- A person or an account needs a face: a comment author, an assignee cell, the shell's user menu.
- The picture may be missing, and initials are an acceptable stand-in.
- Several people share one row and overlapping them reads better than listing them.

## Do

- Compose it: `AvatarImage`, then `AvatarFallback`, plus `AvatarBadge` for a presence or status dot.
- Pick the box with `size="sm" | "default" | "lg"` (24 / 32 / 40 px); it writes the `data-size` the other parts read.
- Overlap a row with `AvatarGroup` and close it with `AvatarGroupCount`, which sizes itself from the avatars around it; give `AvatarImage` an `alt` only when the picture carries the identity.
- Recolour `AvatarBadge` only, and only with a Tecton step: `className="bg-green-560"`.

## Don't

### HIGH An avatar image with no fallback

Wrong:

```tsx
<Avatar>
  <AvatarImage src={user.avatarUrl} alt={user.name} />
</Avatar>
```

Correct:

```tsx
<Avatar>
  <AvatarImage src={user.avatarUrl} alt={user.name} />
  <AvatarFallback>{initials(user.name)}</AvatarFallback>
</Avatar>
```

`AvatarImage` starts in `data-state="error"` when `src` is empty and switches to it on the first failed request, and the class that acts on that is `data-[state=error]:hidden`, so with nothing behind it the avatar is an empty ring — only `AvatarFallback` carries the `peer-data-[state=error]:flex` that brings content back.

### MEDIUM An avatar sized with className

Wrong:

```tsx
<AvatarGroup>
  <Avatar className="size-10">
    <AvatarImage src={lead.avatarUrl} alt={lead.name} /><AvatarFallback>AB</AvatarFallback>
  </Avatar>
  <AvatarGroupCount>+3</AvatarGroupCount>
</AvatarGroup>
```

Correct:

```tsx
<AvatarGroup>
  <Avatar size="lg">
    <AvatarImage src={lead.avatarUrl} alt={lead.name} /><AvatarFallback>AB</AvatarFallback>
  </Avatar>
  <AvatarGroupCount>+3</AvatarGroupCount>
</AvatarGroup>
```

`size` is what writes `data-size`, and `AvatarBadge` and `AvatarGroupCount` size themselves from it through `group-data-[size=lg]/avatar` and `group-has-data-[size=lg]/avatar-group`, so a hand-set `size-10` leaves the dot and the count bubble at the default 32 px; `size-*` is on the `no-restyle` deny list for the same reason.

### HIGH A stock colour on the status dot

Wrong:

```tsx
<Avatar>
  <AvatarImage src={user.avatarUrl} alt={user.name} /><AvatarFallback>RK</AvatarFallback>
  <AvatarBadge className="bg-green-500" />
</Avatar>
```

Correct:

```tsx
<Avatar>
  <AvatarImage src={user.avatarUrl} alt={user.name} /><AvatarFallback>RK</AvatarFallback>
  <AvatarBadge className="bg-green-560" />
</Avatar>
```

`AvatarBadge` is the one part whose colour the application picks, but the Tecton palette is declared after `--color-*: initial`, so `green-500` is not a step, the class emits no CSS and the dot silently falls back to `bg-primary`.
