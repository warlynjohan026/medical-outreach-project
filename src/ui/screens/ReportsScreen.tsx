import { useEffect, useState } from 'react'
import { DataCard } from '../components/DataCard'
import { PageHeader } from '../components/PageHeader'
import { ReportCard } from '../components/ReportCard'
import { reportCards } from '../data/mockData'
import { searchOutreaches } from '../services/outreachesService'
import { getPatients } from '../services/patientsService'
import type { Outreach, Patient } from '../types'

export function ReportsScreen() {
  const [outreaches, setOutreaches] = useState<Outreach[]>([])
  const [patients, setPatients] = useState<Patient[]>([])

  useEffect(() => {
    let isMounted = true

    async function loadReportOptions() {
      try {
        const [outreachItems, patientItems] = await Promise.all([
          searchOutreaches({ location: '', name: '', operativeDate: '', status: '' }),
          getPatients(),
        ])

        if (isMounted) {
          setOutreaches(outreachItems)
          setPatients(patientItems)
        }
      } catch (error) {
        console.error('No se pudieron cargar las opciones de reportes', error)
      }
    }

    loadReportOptions()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <>
      <PageHeader
        subtitle="Crea reportes en PDF y Excel para compartir o guardar"
        title="Reportes"
      />
      <DataCard title="Reportes disponibles">
        <div className="grid grid-cols-1 gap-3.5 px-[22px] pb-6 pt-[18px] lg:grid-cols-3">
          {reportCards.map((report) => (
            <ReportCard
              key={report.title}
              parameterOptions={{
                outreaches: outreaches
                  .filter((outreach) => outreach.id)
                  .map((outreach) => ({
                    label: `${outreach.name} · ${outreach.location} · ${outreach.date}`,
                    value: outreach.id ?? '',
                  })),
                patients: patients
                  .filter((patient) => patient.id)
                  .map((patient) => ({
                    label: `${patient.name} · ${patient.document}`,
                    value: patient.id ?? '',
                  })),
              }}
              {...report}
            />
          ))}
        </div>
      </DataCard>
    </>
  )
}
