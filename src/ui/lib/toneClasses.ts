import type { BadgeTone } from '../types'

export const toneClasses: Record<BadgeTone, string> = {
  sun: 'bg-[var(--sun)] text-[#71551c]',
  soft: 'bg-[var(--soft)] text-[var(--primary-dark)]',
  rose: 'bg-[var(--rose)] text-[#884a45]',
  blue: 'bg-[var(--blue-soft)] text-[#315d82]',
  primary: 'bg-[var(--primary)] text-white',
}
