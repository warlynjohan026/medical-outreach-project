type FormFieldProps = {
  label: string
  onChange?: (value: string) => void
  placeholder?: string
  value?: string
}

export function FormField({ label, onChange, placeholder, value }: FormFieldProps) {
  return (
    <label className="grid gap-[7px]">
      <span className="text-xs font-extrabold text-[var(--muted)]">{label}</span>
      <input
        aria-label={label}
        className="min-h-[42px] w-full rounded-[13px] border border-[var(--line)] bg-white px-3 text-[13px] text-[var(--ink)] placeholder:text-[var(--muted)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(94,200,189,0.4)]"
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder ?? value}
        value={value}
      />
    </label>
  )
}
