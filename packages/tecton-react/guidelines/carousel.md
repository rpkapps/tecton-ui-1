---
component: Carousel
module: "@tecton/react/components/carousel"
family: presentation
exports: [Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, useCarousel]
notFor:
  - need: sections the reader chooses by name
    use: Tabs
  - need: a row of cards the reader scrolls freely
    use: ScrollArea
related: [Tabs, ScrollArea, AspectRatio]
---

## Use it when

- A short, ordered set of equal tiles does not fit and stepping through them is the point: onboarding slides, a gallery, featured records.
- Nothing is lost if the reader never reaches the last slide.
- The set is small enough that every slide can be in the DOM at once.

## Do

- Compose it: `Carousel`, then `CarouselContent` holding `CarouselItem`s, then `CarouselPrevious` and `CarouselNext` as siblings of the content.
- Pass Embla options on `Carousel` through `opts` (`{ align: "start", loop: true }`) and plugins through `plugins`.
- Switch the axis with `orientation="vertical"`, never with an Embla `axis` option, and set how many slides show with `basis-*` on `CarouselItem`; the `-ml-4` / `pl-4` gutter is already on the parts.
- Read position and react to moves through `setApi` and the Embla instance; there is no selected-index prop.

## Don't

### HIGH Embla options on CarouselContent

Wrong:

```tsx
<Carousel className="w-full max-w-sm">
  <CarouselContent opts={{ align: "start", loop: true }}>
    <CarouselItem className="basis-1/2">{first}</CarouselItem>
  </CarouselContent>
  <CarouselPrevious /><CarouselNext />
</Carousel>
```

Correct:

```tsx
<Carousel opts={{ align: "start", loop: true }} className="w-full max-w-sm">
  <CarouselContent>
    <CarouselItem className="basis-1/2">{first}</CarouselItem>
  </CarouselContent>
  <CarouselPrevious /><CarouselNext />
</Carousel>
```

`useEmblaCarousel(opts)` is called in `Carousel`; `CarouselContent` only holds the viewport ref and spreads the rest onto a plain `div`, so the object becomes a stray attribute and the carousel runs on Embla's defaults.

### HIGH A vertical carousel set through the Embla axis

Wrong:

```tsx
<Carousel opts={{ axis: "y" }} className="h-80 w-full max-w-xs">
  <CarouselContent>
    <CarouselItem className="basis-1/2">{first}</CarouselItem>
  </CarouselContent>
  <CarouselPrevious /><CarouselNext />
</Carousel>
```

Correct:

```tsx
<Carousel orientation="vertical" className="w-full max-w-xs">
  <CarouselContent className="h-80">
    <CarouselItem className="basis-1/2">{first}</CarouselItem>
  </CarouselContent>
  <CarouselPrevious /><CarouselNext />
</Carousel>
```

`Carousel` builds the options as `{ ...opts, axis: orientation === "horizontal" ? "x" : "y" }`, so an `axis` in `opts` is always overwritten — and only `orientation` also switches the content to `flex-col` and moves the previous and next buttons onto the vertical axis.

### MEDIUM Slide width set with w-* instead of basis-*

Wrong:

```tsx
<CarouselContent>
  <CarouselItem className="w-1/3">{card}</CarouselItem>
</CarouselContent>
```

Correct:

```tsx
<CarouselContent>
  <CarouselItem className="basis-1/3">{card}</CarouselItem>
</CarouselContent>
```

`CarouselItem` is `min-w-0 shrink-0 grow-0 basis-full`, and in a flex row `flex-basis` sets the main size, so `w-1/3` survives the `cn` merge, changes nothing, and every slide still fills the viewport.
