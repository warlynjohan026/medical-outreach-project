import type { ReportOption } from '../types'
import { Button } from './Button'

export function ReportCard({ description, endpoints, title }: ReportOption) {
  return (
    <article className="grid min-h-[210px] content-start gap-3.5 rounded-[20px] border border-[var(--line)] bg-white p-[18px]">
      <strong className="text-[15px] text-[var(--ink)]">{title}</strong>
      <p className="m-0 text-[13px] leading-normal text-[var(--muted)]">{description}</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary">PDF</Button>
        <Button variant="secondary">Excel</Button>
      </div>
      <div className="mt-0.5 grid gap-2">
        {endpoints.map((endpoint) => (
          <span
            className="rounded-xl border border-[var(--line)] bg-[var(--soft)] px-2.5 py-2 text-[11px] leading-snug font-extrabold text-[var(--primary-dark)]"
            key={endpoint}
          >
            {endpoint}
          </span>
        ))}
      </div>
    </article>
  )
}
