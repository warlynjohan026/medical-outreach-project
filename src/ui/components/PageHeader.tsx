export function PageHeader({ subtitle, title }: { subtitle: string; title: string }) {
  return (
    <div className="mb-[22px] flex items-end justify-between gap-6 motion-stagger">
      <div>
        <h1 className="m-0 mb-2 text-[32px] leading-tight font-bold text-[var(--ink)]">{title}</h1>
        <p className="m-0 text-sm text-[var(--muted)]">{subtitle}</p>
      </div>
    </div>
  )
}
