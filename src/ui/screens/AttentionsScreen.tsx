import { Eye, XClose } from '@untitledui/icons'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Button } from '../components/Button'
import { DataCard } from '../components/DataCard'
import { FormField } from '../components/FormField'
import { PageHeader } from '../components/PageHeader'
import { Table, TableCard } from '../components/untitledui/application/table/table'
import {
  createAttention,
  deleteAttention,
  getAttentions,
  searchAttentions,
  updateAttention,
} from '../services/attentionsService'
import type { Attention, CreateAttentionPayload, SearchAttentionParams } from '../types'

const ATTENTIONS_PER_PAGE = 7

const emptyAttentionForm: CreateAttentionPayload = {
  attentionDate: '',
  doctor: '',
  medication: '',
  operativeId: '',
  patientId: '',
}

export function AttentionsScreen() {
  const [attentions, setAttentions] = useState<Attention[]>([])
  const [filters, setFilters] = useState<SearchAttentionParams>({
    attentionDate: '',
    doctor: '',
    operativeName: '',
    patientName: '',
  })
  const [form, setForm] = useState<CreateAttentionPayload>(emptyAttentionForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [selectedAttention, setSelectedAttention] = useState<Attention | null>(null)

  const hasPagination = attentions.length > ATTENTIONS_PER_PAGE
  const totalPages = Math.max(1, Math.ceil(attentions.length / ATTENTIONS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginatedAttentions = attentions.slice(
    (currentPage - 1) * ATTENTIONS_PER_PAGE,
    currentPage * ATTENTIONS_PER_PAGE,
  )
  const canSaveAttention = Boolean(
    form.patientId.trim() &&
    form.operativeId.trim() &&
    form.doctor.trim() &&
    form.medication.trim() &&
    form.attentionDate.trim(),
  )

  useEffect(() => {
    let isMounted = true

    getAttentions()
      .then((data) => {
        if (isMounted) {
          setAttentions(data)
          setError(null)
        }
      })
      .catch((apiError: unknown) => {
        if (isMounted) {
          setError(getErrorMessage(apiError))
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

  async function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (filters.attentionDate && !isValidDisplayDate(filters.attentionDate)) {
      setError('La fecha debe estar en formato dd/mm/aaaa.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const hasServerFilters = Boolean(filters.attentionDate?.trim() || filters.doctor?.trim())
      const data = hasServerFilters ? await searchAttentions(filters) : await getAttentions()
      setAttentions(filterAttentionsByName(data, filters))
      setPage(1)
    } catch (apiError) {
      setError(getErrorMessage(apiError))
      setAttentions([])
      setPage(1)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleClearFilters() {
    setFilters({
      attentionDate: '',
      doctor: '',
      operativeName: '',
      patientName: '',
    })
    setError(null)
    setIsLoading(true)

    try {
      const data = await getAttentions()
      setAttentions(data)
      setPage(1)
    } catch (apiError) {
      setError(getErrorMessage(apiError))
      setAttentions([])
      setPage(1)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationError = validateAttentionForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      if (editingId) {
        const updatedAttention = await updateAttention(editingId, form)
        setAttentions((currentAttentions) =>
          currentAttentions.map((attention) =>
            attention.id === editingId ? updatedAttention : attention,
          ),
        )
      } else {
        const createdAttention = await createAttention(form)
        setAttentions((currentAttentions) => [createdAttention, ...currentAttentions])
        setPage(1)
      }

      resetForm()
    } catch (apiError) {
      setError(getErrorMessage(apiError))
    } finally {
      setIsSaving(false)
    }
  }

  function handleEdit(attention: Attention) {
    if (!attention.id) {
      setError('Esta atención no tiene ID para actualizar.')
      return
    }

    setEditingId(attention.id)
    setForm({
      attentionDate: attention.date === 'Sin fecha' ? '' : attention.date,
      doctor: attention.doctor === 'Sin médico' ? '' : attention.doctor,
      medication: attention.medication === 'Sin medicamento' ? '' : attention.medication,
      operativeId: attention.operativeId,
      patientId: attention.patientId,
    })
    setError(null)
  }

  async function handleDelete(attention: Attention) {
    if (!attention.id) {
      setError('Esta atención no tiene ID para eliminar.')
      return
    }

    const shouldDelete = window.confirm(`¿Eliminar la atención de "${attention.patient}"?`)
    if (!shouldDelete) {
      return
    }

    setError(null)

    try {
      await deleteAttention(attention.id)
      setAttentions((currentAttentions) =>
        currentAttentions.filter((currentAttention) => currentAttention.id !== attention.id),
      )
      setSelectedAttention((currentAttention) =>
        currentAttention?.id === attention.id ? null : currentAttention,
      )
      if (editingId === attention.id) {
        resetForm()
      }
    } catch (apiError) {
      setError(getErrorMessage(apiError))
    }
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyAttentionForm)
  }

  return (
    <>
      <PageHeader
        subtitle="Médico, medicamento y fecha dentro de cada operativo."
        title="Atenciones"
      />
      {selectedAttention ? (
        <AttentionDetailCard
          attention={selectedAttention}
          onClose={() => setSelectedAttention(null)}
          onDelete={() => handleDelete(selectedAttention)}
          onEdit={() => {
            handleEdit(selectedAttention)
            setSelectedAttention(null)
          }}
        />
      ) : null}
      <form
        className="motion-card motion-stagger mb-[18px] grid grid-cols-1 gap-x-4 gap-y-3 rounded-[24px] border border-[rgba(255,255,255,0.78)] bg-[rgba(255,255,255,0.72)] p-3 shadow-[0_10px_28px_rgba(28,28,34,0.04)] md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        onSubmit={handleFilterSubmit}
      >
        <FilterInput
          label="Paciente"
          onChange={(patientName) =>
            setFilters((currentFilters) => ({ ...currentFilters, patientName }))
          }
          placeholder="Juan"
          value={filters.patientName ?? ''}
        />
        <FilterInput
          label="Operativo"
          onChange={(operativeName) =>
            setFilters((currentFilters) => ({ ...currentFilters, operativeName }))
          }
          placeholder="Aleman"
          value={filters.operativeName ?? ''}
        />
        <FilterInput
          label="Médico"
          onChange={(doctor) => setFilters((currentFilters) => ({ ...currentFilters, doctor }))}
          placeholder="María"
          value={filters.doctor ?? ''}
        />
        <FilterInput
          label="Fecha"
          onChange={(attentionDate) =>
            setFilters((currentFilters) => ({ ...currentFilters, attentionDate }))
          }
          placeholder="15/05/2026"
          value={filters.attentionDate ?? ''}
        />
        <div className="flex items-end xl:col-start-1">
          <Button
            className="w-full disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLoading}
            type="submit"
          >
            Buscar
          </Button>
        </div>
        <div className="flex items-end">
          <Button
            className="w-full disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLoading}
            onClick={handleClearFilters}
            type="button"
            variant="secondary"
          >
            Limpiar
          </Button>
        </div>
      </form>

      <section className="grid min-w-0 grid-cols-1 gap-[22px] lg:grid-cols-[minmax(0,1fr)_340px]">
        <TableCard.Root
          className="motion-card min-w-0 self-start overflow-hidden rounded-[30px] border border-[rgba(255,255,255,0.78)] bg-[rgba(255,255,255,0.88)] shadow-[0_16px_44px_rgba(28,28,34,0.06)]"
          size="sm"
        >
          <TableCard.Header
            badge={`Hey! hay ${attentions.length} atenciones`}
            className="border-b border-[var(--line)] bg-white/80 px-[22px] py-[18px]"
            title="Atenciones recientes"
          />
          <div className="min-w-0 px-[22px] py-[18px]">
            {error ? <StatusMessage message={error} tone="error" /> : null}
            {isLoading ? (
              <StatusMessage message="Cargando atenciones..." />
            ) : attentions.length === 0 ? (
              <StatusMessage message="No existen registros." />
            ) : (
              <div className="h-[466px] overflow-auto">
                <Table
                  aria-label="Atenciones registradas"
                  className="w-full min-w-[780px] table-fixed"
                  size="sm"
                >
                  <Table.Header>
                    <Table.Head id="patient" className="w-[24%] px-4">
                      <span className="text-[12px] font-extrabold text-[var(--muted)]">
                        Paciente
                      </span>
                    </Table.Head>
                    <Table.Head id="doctor" className="w-[20%] px-4">
                      <span className="text-[12px] font-extrabold text-[var(--muted)]">Médico</span>
                    </Table.Head>
                    <Table.Head id="medication" className="w-[22%] px-4">
                      <span className="text-[12px] font-extrabold text-[var(--muted)]">
                        Medicamento
                      </span>
                    </Table.Head>
                    <Table.Head id="date" className="w-[14%] px-4">
                      <span className="text-[12px] font-extrabold text-[var(--muted)]">Fecha</span>
                    </Table.Head>
                    <Table.Head id="detail" className="w-[92px] px-4">
                      <span className="block text-right text-[12px] font-extrabold text-[var(--muted)]">
                        Detalle
                      </span>
                    </Table.Head>
                  </Table.Header>
                  <Table.Body>
                    {paginatedAttentions.map((attention) => (
                      <AttentionRow
                        attention={attention}
                        key={attention.id ?? `${attention.patientId}-${attention.date}`}
                        onView={() => setSelectedAttention(attention)}
                      />
                    ))}
                  </Table.Body>
                </Table>
              </div>
            )}
          </div>
          {!isLoading && !error && hasPagination ? (
            <div className="flex flex-col gap-3 border-t border-[var(--line)] px-[22px] py-4 sm:flex-row sm:items-center sm:justify-between">
              <Button
                className="disabled:cursor-not-allowed disabled:opacity-50"
                disabled={currentPage === 1}
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                type="button"
                variant="secondary"
              >
                Anterior
              </Button>
              <span className="text-center text-[13px] font-bold text-[var(--muted)]">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                className="disabled:cursor-not-allowed disabled:opacity-50"
                disabled={currentPage === totalPages}
                onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                type="button"
                variant="secondary"
              >
                Siguiente
              </Button>
            </div>
          ) : null}
        </TableCard.Root>

        <DataCard
          className="self-start"
          title={editingId ? 'Editar atención' : 'Registrar atención'}
        >
          <form className="grid gap-3.5 px-[22px] pb-6 pt-[18px]" onSubmit={handleSubmit}>
            <FormField
              label="Paciente ID"
              onChange={(patientId) => setForm((currentForm) => ({ ...currentForm, patientId }))}
              placeholder="1"
              value={form.patientId}
            />
            <FormField
              label="Operativo ID"
              onChange={(operativeId) =>
                setForm((currentForm) => ({ ...currentForm, operativeId }))
              }
              placeholder="1"
              value={form.operativeId}
            />
            <FormField
              label="Médico"
              onChange={(doctor) => setForm((currentForm) => ({ ...currentForm, doctor }))}
              placeholder="Dra. María Rodríguez"
              value={form.doctor}
            />
            <FormField
              label="Medicamento"
              onChange={(medication) => setForm((currentForm) => ({ ...currentForm, medication }))}
              placeholder="Acetaminofén 500mg"
              value={form.medication}
            />
            <FormField
              label="Fecha"
              onChange={(attentionDate) =>
                setForm((currentForm) => ({ ...currentForm, attentionDate }))
              }
              placeholder="dd/mm/aaaa"
              value={form.attentionDate}
            />
            <Button
              className="gap-2 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving || !canSaveAttention}
              type="submit"
            >
              {isSaving ? <Spinner /> : null}
              {isSaving
                ? editingId
                  ? 'Actualizando...'
                  : 'Creando...'
                : editingId
                  ? 'Actualizar atención'
                  : 'Registrar atención'}
            </Button>
            {editingId ? (
              <Button disabled={isSaving} onClick={resetForm} type="button" variant="secondary">
                Cancelar
              </Button>
            ) : null}
          </form>
        </DataCard>
      </section>
    </>
  )
}

function AttentionRow({ attention, onView }: { attention: Attention; onView: () => void }) {
  return (
    <Table.Row
      id={attention.id ?? `${attention.patientId}-${attention.date}`}
      className="motion-row align-top"
    >
      <Table.Cell className="px-4 py-4 align-top">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--soft)] text-[13px] font-black text-[var(--primary-dark)]">
            {attention.day}
          </span>
          <div className="min-w-0">
            <span className="block text-sm leading-5 break-words text-[var(--ink)]">
              {attention.patient}
            </span>
            <span className="text-xs text-[var(--muted)]">ID {attention.patientId || '-'}</span>
          </div>
        </div>
      </Table.Cell>
      <Table.Cell className="px-4 py-4 align-top text-sm break-words text-[var(--ink)]">
        {attention.doctor}
      </Table.Cell>
      <Table.Cell className="px-4 py-4 align-top text-sm break-words text-[var(--ink)]">
        {attention.medication}
      </Table.Cell>
      <Table.Cell className="px-4 py-4 align-top text-sm whitespace-nowrap text-[var(--muted)]">
        {attention.date}
      </Table.Cell>
      <Table.Cell className="px-4 py-4 align-top">
        <div className="flex justify-end">
          <button
            aria-label={`Ver atención de ${attention.patient}`}
            className="inline-flex h-8 min-w-[72px] items-center justify-center gap-1 rounded-[9px] border border-[var(--line)] bg-white px-2 text-[10px] font-bold whitespace-nowrap text-[var(--primary-dark)] transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--soft)]"
            onClick={onView}
            type="button"
          >
            <Eye className="size-4" />
            Ver más
          </button>
        </div>
      </Table.Cell>
    </Table.Row>
  )
}

function AttentionDetailCard({
  attention,
  onClose,
  onDelete,
  onEdit,
}: {
  attention: Attention
  onClose: () => void
  onDelete: () => void
  onEdit: () => void
}) {
  return (
    <div className="modal-scrim fixed inset-0 z-30 grid place-items-center bg-[rgba(32,44,42,0.28)] px-4 py-6 backdrop-blur-[2px]">
      <section className="modal-panel w-full max-w-[620px] overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.88)] bg-white shadow-[0_24px_80px_rgba(28,28,34,0.22)]">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[var(--soft)] text-[14px] font-black text-[var(--primary-dark)]">
              {attention.day}
            </span>
            <div className="min-w-0">
              <h2 className="m-0 truncate text-lg font-bold text-[var(--ink)]">
                {attention.patient}
              </h2>
              <p className="m-0 text-xs font-semibold text-[var(--muted)]">
                Atención ID {attention.id ?? '-'}
              </p>
            </div>
          </div>
          <button
            aria-label="Cerrar detalle"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--accent)] hover:bg-[var(--soft)] hover:text-[var(--primary-dark)]"
            onClick={onClose}
            type="button"
          >
            <XClose className="size-4" />
          </button>
        </div>

        <div className="motion-stagger grid gap-3 px-5 py-5 sm:grid-cols-2">
          <DetailItem label="Paciente" value={attention.patient} />
          <DetailItem label="Paciente ID" value={attention.patientId || 'Sin ID'} />
          <DetailItem label="Operativo ID" value={attention.operativeId || 'Sin ID'} />
          <DetailItem label="Médico" value={attention.doctor} />
          <DetailItem label="Medicamento" value={attention.medication} />
          <DetailItem label="Fecha" value={attention.date} />
        </div>

        <div className="flex flex-col gap-2 border-t border-[var(--line)] bg-[var(--bg)] px-5 py-4 sm:flex-row sm:justify-end">
          <Button onClick={onEdit} type="button" variant="secondary">
            Editar
          </Button>
          <button
            className="inline-flex min-h-[38px] items-center justify-center rounded-[10px] border border-[var(--rose)] bg-[var(--rose)] px-[18px] text-[13px] font-extrabold text-[#884a45] transition hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(136,74,69,0.12)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(94,200,189,0.4)]"
            onClick={onDelete}
            type="button"
          >
            Eliminar
          </button>
        </div>
      </section>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="motion-row rounded-[16px] border border-[var(--line)] bg-[var(--soft)] px-4 py-3">
      <span className="mb-1 block text-xs font-extrabold text-[var(--muted)]">{label}</span>
      <div className="text-sm font-normal break-words text-[var(--ink)]">{value}</div>
    </div>
  )
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"
    />
  )
}

function FilterInput({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string
  onChange: (value: string) => void
  placeholder: string
  value: string
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-extrabold text-[var(--muted)]">{label}</span>
      <input
        className="h-11 rounded-[14px] border border-[var(--line)] bg-white px-3 text-[13px] font-bold text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--line-strong)] focus:border-[var(--accent)] focus:shadow-[0_0_0_4px_rgba(94,200,189,0.12)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(94,200,189,0.4)]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  )
}

function StatusMessage({ message, tone = 'info' }: { message: string; tone?: 'error' | 'info' }) {
  return (
    <div
      className={
        tone === 'error'
          ? 'mb-3 rounded-[18px] border border-[var(--rose)] bg-[var(--rose)] px-4 py-3 text-[13px] font-bold break-words text-[#884a45]'
          : 'rounded-[18px] border border-[var(--line)] bg-white px-4 py-3 text-[13px] font-bold text-[var(--muted)]'
      }
    >
      {message}
    </div>
  )
}

function validateAttentionForm(form: CreateAttentionPayload) {
  if (!form.patientId.trim()) {
    return 'El ID del paciente es obligatorio.'
  }

  if (!form.operativeId.trim()) {
    return 'El ID del operativo es obligatorio.'
  }

  if (!form.doctor.trim()) {
    return 'El médico es obligatorio.'
  }

  if (!form.medication.trim()) {
    return 'El medicamento es obligatorio.'
  }

  if (!form.attentionDate.trim()) {
    return 'La fecha de atención es obligatoria.'
  }

  if (!isValidDisplayDate(form.attentionDate)) {
    return 'La fecha de atención debe estar en formato dd/mm/aaaa.'
  }

  return null
}

function isValidDisplayDate(value: string) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return false
  }

  const [day, month, year] = value.split('/').map(Number)
  const date = new Date(year, month - 1, day)

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

function filterAttentionsByName(attentions: Attention[], filters: SearchAttentionParams) {
  const patientName = normalizeSearchValue(filters.patientName)
  const operativeName = normalizeSearchValue(filters.operativeName)

  return attentions.filter((attention) => {
    const matchesPatient =
      !patientName || normalizeSearchValue(attention.patient).includes(patientName)
    const matchesOperative =
      !operativeName || normalizeSearchValue(attention.operative).includes(operativeName)

    return matchesPatient && matchesOperative
  })
}

function normalizeSearchValue(value: string | undefined) {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getErrorMessage(error: unknown) {
  const message =
    error instanceof Error ? error.message : 'No se pudo completar la llamada al backend.'

  return mapApiErrorMessage(message)
}

function mapApiErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes('attentiondate') && normalizedMessage.includes('dd/mm/yyyy')) {
    return 'La fecha de atención debe estar en formato dd/mm/aaaa.'
  }

  if (normalizedMessage.includes('patientid')) {
    return 'Revisa el ID del paciente.'
  }

  if (normalizedMessage.includes('operativeid')) {
    return 'Revisa el ID del operativo.'
  }

  if (normalizedMessage.includes('doctor')) {
    return 'Revisa el médico de la atención.'
  }

  if (normalizedMessage.includes('medication')) {
    return 'Revisa el medicamento de la atención.'
  }

  return message
}
