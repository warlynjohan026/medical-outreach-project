import { Button } from './Button'
import { DataCard } from './DataCard'
import { FormField } from './FormField'

type FormCardProps = {
  action: string
  endpoint: string
  fields: Array<[string, string]>
  title: string
}

export function FormCard({ action, endpoint, fields, title }: FormCardProps) {
  return (
    <DataCard className="self-start" title={title}>
      <div className="grid gap-3.5 px-[22px] pb-6 pt-[18px]">
        {fields.map(([label, value]) => (
          <FormField key={label} label={label} placeholder={value} />
        ))}
        <Button>{action}</Button>
        <span className="rounded-xl border border-[var(--line)] bg-[var(--soft)] px-2.5 py-2 text-[11px] leading-snug font-extrabold text-[var(--primary-dark)]">
          {endpoint}
        </span>
      </div>
    </DataCard>
  )
}
