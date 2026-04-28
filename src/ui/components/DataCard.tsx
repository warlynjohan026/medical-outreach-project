import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

type DataCardProps = {
  children: ReactNode
  className?: string
  title?: string
}

export function DataCard({ children, className, title }: DataCardProps) {
  return (
    <section
      className={cn(
        'motion-card rounded-[30px] border border-[rgba(255,255,255,0.78)] bg-[rgba(255,255,255,0.88)] shadow-[0_16px_44px_rgba(28,28,34,0.06)]',
        className,
      )}
    >
      {title ? (
        <h2 className="m-0 px-[22px] pb-2 pt-[22px] text-lg leading-tight font-semibold text-[var(--ink)]">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  )
}
