import type { ReactNode } from 'react'

export function AppShell({ children }: { children: ReactNode }) {
  return <div className="min-h-svh bg-[var(--bg)] text-[var(--ink)]">{children}</div>
}
