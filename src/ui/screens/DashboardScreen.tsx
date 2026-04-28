import { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/Button'
import { DataCard } from '../components/DataCard'
import { DataRow } from '../components/DataRow'
import { MetricCard } from '../components/MetricCard'
import { getAttentions } from '../services/attentionsService'
import { getOutreaches } from '../services/outreachesService'
import { getPatients } from '../services/patientsService'
import type { Attention, Metric, Outreach, Patient } from '../types'

export function DashboardScreen() {
  const [attentions, setAttentions] = useState<Attention[]>([])
  const [outreaches, setOutreaches] = useState<Outreach[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    Promise.all([getOutreaches(), getPatients(), getAttentions()])
      .then(([outreachesData, patientsData, attentionsData]) => {
        if (isMounted) {
          setOutreaches(outreachesData)
          setPatients(patientsData)
          setAttentions(attentionsData)
          setError(null)
        }
      })
      .catch((apiError: unknown) => {
        if (isMounted) {
          setError(getErrorMessage(apiError))
          setOutreaches([])
          setPatients([])
          setAttentions([])
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const activeOutreaches = useMemo(
    () => outreaches.filter((outreach) => outreach.statusValue === '1'),
    [outreaches],
  )

  const todayOutreach = activeOutreaches[0] ?? outreaches[0]

  const metrics = useMemo<Metric[]>(
    () => [
      {
        value: activeOutreaches.length.toLocaleString(),
        label: 'Operativos activos',
        tone: 'primary',
      },
      { value: patients.length.toLocaleString(), label: 'Pacientes', tone: 'accent' },
      { value: attentions.length.toLocaleString(), label: 'Atenciones', tone: 'warning' },
      { value: '0', label: 'Reportes', tone: 'coral' },
    ],
    [activeOutreaches.length, attentions.length, patients.length],
  )

  return (
    <>
      {error ? <StatusMessage message={error} tone="error" /> : null}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        <DataCard className="p-[22px] sm:p-[26px]">
          <span className="inline-flex min-h-[26px] items-center rounded-full bg-[var(--sun)] px-3 text-xs font-extrabold text-[#81611f]">
            Servicio con propósito
          </span>
          <h1 className="m-0 mt-4 max-w-xl text-3xl leading-tight font-bold text-[var(--ink)] sm:text-[34px]">
            Hola Jack.
          </h1>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </div>
        </DataCard>

        <aside className="rounded-[30px] border border-[rgba(255,255,255,0.78)] bg-[var(--primary)] p-[22px] text-white shadow-[0_22px_54px_rgba(44,122,123,0.22)] sm:p-6">
          <span className="inline-flex min-h-[26px] items-center rounded-full bg-[var(--sun)] px-3 text-xs font-extrabold text-[#81611f]">
            Operativo de hoy
          </span>
          <h2 className="m-0 mt-4 text-[30px] leading-tight font-bold text-white">
            {isLoading ? 'Cargando...' : (todayOutreach?.name ?? 'Sin operativo activo')}
          </h2>
          <p className="m-0 mt-2 text-[15px] text-[#ddf5f2]">
            {todayOutreach
              ? `${todayOutreach.location} | ${todayOutreach.date}`
              : 'No existen registros.'}
          </p>
          <div className="my-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-2">
            <div className="rounded-[20px] border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.17)] px-4 py-3.5">
              <strong className="block text-2xl text-white">{patients.length}</strong>
              <span className="text-[13px] text-[#ddf5f2]">pacientes</span>
            </div>
            <div className="rounded-[20px] border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.17)] px-4 py-3.5">
              <strong className="block text-2xl text-white">{attentions.length}</strong>
              <span className="text-[13px] text-[#ddf5f2]">atenciones</span>
            </div>
          </div>
          <Button variant="secondary">Abrir operativo</Button>
          <div className="mt-[18px] grid gap-1 rounded-[20px] bg-[rgba(255,255,255,0.16)] p-4 text-[#eefdf9]">
            <strong>“Servimos porque Cristo nos sirvió primero.”</strong>
            <span className="text-[13px] text-[#ddf5f2]">
              Registrar con orden también es cuidar con amor.
            </span>
          </div>
        </aside>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DataCard title="Pacientes recientes">
          <div className="grid gap-3 px-[22px] pb-6 pt-[18px]">
            {isLoading ? (
              <StatusMessage message="Cargando pacientes..." />
            ) : patients.length === 0 ? (
              <StatusMessage message="No existen registros." />
            ) : (
              patients
                .slice(0, 3)
                .map((patient) => (
                  <DataRow
                    badge={patient.condition}
                    badgeTone={patient.tone}
                    icon={patient.initials}
                    key={patient.id ?? patient.document}
                    meta={`${patient.document} | ${patient.address}`}
                    title={patient.name}
                  />
                ))
            )}
          </div>
        </DataCard>

        <DataCard title="Atenciones recientes">
          <div className="grid gap-3 px-[22px] pb-6 pt-[18px]">
            {isLoading ? (
              <StatusMessage message="Cargando atenciones..." />
            ) : attentions.length === 0 ? (
              <StatusMessage message="No existen registros." />
            ) : (
              attentions
                .slice(0, 3)
                .map((attention) => (
                  <DataRow
                    badge={attention.status}
                    badgeTone={attention.tone}
                    icon={attention.day}
                    key={attention.id ?? `${attention.patientId}-${attention.date}`}
                    meta={`${attention.doctor} | ${attention.medication}`}
                    title={attention.patient}
                  />
                ))
            )}
          </div>
        </DataCard>
      </section>
    </>
  )
}

function StatusMessage({ message, tone = 'info' }: { message: string; tone?: 'error' | 'info' }) {
  return (
    <div
      className={
        tone === 'error'
          ? 'mb-4 rounded-[18px] border border-[var(--rose)] bg-[var(--rose)] px-4 py-3 text-[13px] font-bold text-[#884a45]'
          : 'rounded-[18px] border border-[var(--line)] bg-white px-4 py-3 text-[13px] font-bold text-[var(--muted)]'
      }
    >
      {message}
    </div>
  )
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'No se pudo completar la llamada al backend.'
}
