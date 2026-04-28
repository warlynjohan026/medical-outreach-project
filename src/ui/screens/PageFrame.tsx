import type { ReactNode } from 'react'
import { FilterBar } from '../components/FilterBar'
import { PageHeader } from '../components/PageHeader'

type PageFrameProps = {
  children: ReactNode
  filterAction?: string
  filters?: string[]
  subtitle: string
  title: string
}

export function PageFrame({ children, filterAction, filters, subtitle, title }: PageFrameProps) {
  return (
    <>
      <PageHeader subtitle={subtitle} title={title} />
      {filters && filterAction ? <FilterBar action={filterAction} filters={filters} /> : null}
      <section className="grid grid-cols-1 gap-[22px] lg:grid-cols-[minmax(0,1fr)_340px]">
        {children}
      </section>
    </>
  )
}
