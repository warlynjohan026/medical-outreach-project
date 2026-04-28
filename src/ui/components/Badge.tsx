import { cn } from '../lib/cn'
import { toneClasses } from '../lib/toneClasses'
import type { BadgeTone } from '../types'

export function Badge({ children, tone = 'sun' }: { children: React.ReactNode; tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        'inline-flex min-h-7 min-w-16 items-center justify-center rounded-full px-2.5 text-[11px] font-extrabold whitespace-nowrap',
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  )
}
