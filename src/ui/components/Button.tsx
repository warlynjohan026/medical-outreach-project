import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

type ButtonProps = {
  children: ReactNode
  className?: string
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: 'primary' | 'secondary'
}

export function Button({
  children,
  className,
  disabled = false,
  onClick,
  type = 'button',
  variant = 'primary',
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex min-h-[38px] cursor-pointer items-center justify-center rounded-[10px] border px-[18px] text-[13px] font-extrabold whitespace-nowrap transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(94,200,189,0.4)]',
        variant === 'primary' && 'border-transparent bg-[var(--primary)] text-white',
        variant === 'secondary' &&
          'border-[rgba(44,122,123,0.1)] bg-white text-[var(--primary-dark)]',
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  )
}
