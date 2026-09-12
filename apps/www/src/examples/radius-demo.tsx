const radii = [
  ["rounded-sm", "2px"],
  ["rounded-md", "4px"],
  ["rounded-lg", "8px"],
  ["rounded-xl", "12px"],
  ["rounded-2xl", "16px"],
  ["rounded-full", "round"],
] as const

export default function RadiusDemo() {
  return (
    <div className="flex flex-wrap items-end gap-6">
      {radii.map(([cls, px]) => (
        <div key={cls} className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
          <div className={`size-16 border bg-secondary ${cls}`} />
          <span className="font-mono">{cls}</span>
          <span>{px}</span>
        </div>
      ))}
    </div>
  )
}
