import { screens } from '../data/mockData'
import { cn } from '../lib/cn'
import type { Screen } from '../types'

type TopNavProps = {
  activeScreen: Screen
  onNavigate: (screen: Screen) => void
}

export function TopNav({ activeScreen, onNavigate }: TopNavProps) {
  return (
    <header className="motion-card mx-3 mt-3 grid min-h-[86px] grid-cols-1 items-center gap-[18px] rounded-[20px] border border-[rgba(255,255,255,0.78)] bg-[var(--surface-soft)] p-4 shadow-[0_18px_50px_rgba(28,28,34,0.08)] lg:mx-6 lg:mt-[22px] lg:grid-cols-[minmax(240px,1fr)_auto_minmax(240px,1fr)] lg:rounded-3xl lg:px-[18px] lg:py-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="soft-pulse flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)] text-lg font-black text-white">
          C
        </span>
        <div className="grid min-w-0 gap-0.5">
          <strong className="text-[15px] leading-tight text-[var(--primary-dark)]">
            Operativos para la comunidad{' '}
          </strong>
          <span className="text-[11px] font-bold text-[var(--muted)]">
            Aquí una pequeña app para ayudarte en tus operativos
          </span>
        </div>
      </div>

      <nav
        aria-label="Secciones principales"
        className="mx-0 flex w-full max-w-full justify-start gap-1 overflow-x-auto rounded-full border border-[rgba(44,122,123,0.1)] bg-[rgba(244,250,248,0.78)] p-1.5 lg:mx-auto lg:w-max lg:justify-center"
      >
        {screens.map((screen) => (
          <button
            className={cn(
              'min-h-9 cursor-pointer rounded-full border-0 bg-transparent px-3.5 text-[13px] font-bold text-[var(--muted)] transition hover:bg-white/70 hover:text-[var(--primary-dark)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(94,200,189,0.4)]',
              screen === activeScreen &&
                'bg-white text-[var(--primary-dark)] shadow-[0_8px_20px_rgba(44,122,123,0.12)]',
            )}
            key={screen}
            type="button"
            onClick={() => onNavigate(screen)}
          >
            {screen}
          </button>
        ))}
      </nav>

      <div aria-hidden="true" className="hidden lg:block" />
    </header>
  )
}
