import { DataCard } from '../components/DataCard'
import { PageHeader } from '../components/PageHeader'
import { ReportCard } from '../components/ReportCard'
import { reportCards } from '../data/mockData'

export function ReportsScreen() {
  return (
    <>
      <PageHeader
        subtitle="Exportaciones PDF y Excel para seguimiento del servicio."
        title="Reportes"
      />
      <DataCard title="Reportes disponibles">
        <div className="grid grid-cols-1 gap-3.5 px-[22px] pb-6 pt-[18px] lg:grid-cols-3">
          {reportCards.map((report) => (
            <ReportCard key={report.title} {...report} />
          ))}
        </div>
      </DataCard>
    </>
  )
}
