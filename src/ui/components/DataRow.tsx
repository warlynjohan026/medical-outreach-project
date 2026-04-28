import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import { toneClasses } from '../lib/toneClasses'
import type { BadgeTone } from '../types'
import { Badge } from './Badge'

type DataRowProps = {
  badge: string
  badgeTone?: BadgeTone
  icon: ReactNode
  meta: string
  title: string
}

export function DataRow({ badge, badgeTone = 'sun', icon, meta, title }: DataRowProps) {
  return (
    <article className="motion-row grid min-h-[66px] grid-cols-[44px_minmax(0,1fr)] items-center gap-3.5 rounded-[18px] border border-[var(--line)] bg-white px-3.5 py-3 sm:grid-cols-[46px_minmax(0,1fr)_auto]">
      <span
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-[15px] text-[13px] font-black',
          toneClasses[badgeTone],
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <strong className="mb-1 block truncate text-sm text-[var(--ink)]">{title}</strong>
        <span className="block truncate text-xs text-[var(--muted)]">{meta}</span>
      </div>
      <div className="col-start-2 justify-self-start sm:col-start-auto sm:justify-self-auto">
        <Badge tone={badgeTone}>{badge}</Badge>
      </div>
    </article>
  )
}
