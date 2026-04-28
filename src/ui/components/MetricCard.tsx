import { cn } from '../lib/cn'
import type { Metric } from '../types'

const metricTones: Record<Metric['tone'], string> = {
  primary: 'after:bg-[var(--primary)]',
  accent: 'after:bg-[var(--accent)]',
  warning: 'after:bg-[var(--warning)]',
  coral: 'after:bg-[var(--coral)]',
}

export function MetricCard({ label, tone, value }: Metric) {
  return (
    <div
      className={cn(
        'motion-row relative min-h-[86px] overflow-hidden rounded-[18px] border border-[rgba(255,255,255,0.76)] bg-[rgba(255,255,255,0.76)] px-4 pb-3.5 pt-4 shadow-[0_10px_28px_rgba(28,28,34,0.06)] after:absolute after:right-4 after:bottom-3.5 after:left-4 after:h-1 after:rounded-full',
        metricTones[tone],
      )}
    >
      <strong className="mb-1 block text-[28px] leading-none text-[var(--ink)]">{value}</strong>
      <span className="text-xs text-[var(--muted)]">{label}</span>
    </div>
  )
}
