import { Button } from './Button'

export function FilterBar({ action, filters }: { action: string; filters: string[] }) {
  return (
    <div className="mb-[18px] grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_0.9fr_0.7fr_auto]">
      {filters.map((filter) => (
        <button
          className="h-11 cursor-pointer rounded-[14px] border border-[var(--line)] bg-[rgba(255,255,255,0.9)] px-3.5 text-left text-[13px] font-bold text-[var(--muted)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(94,200,189,0.4)]"
          key={filter}
          type="button"
        >
          {filter}
        </button>
      ))}
      <Button variant="secondary">{action}</Button>
    </div>
  )
}
