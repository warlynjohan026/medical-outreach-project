import { Eye, XClose } from '@untitledui/icons'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { DataCard } from '../components/DataCard'
import { FormField } from '../components/FormField'
import { PageHeader } from '../components/PageHeader'
import { Table, TableCard } from '../components/untitledui/application/table/table'
import {
  closeOutreach,
  createOutreach,
  deleteOutreach,
  searchOutreaches,
  updateOutreach,
} from '../services/outreachesService'
import type { CreateOutreachPayload, Outreach, SearchOutreachParams } from '../types'

const OUTREACHES_PER_PAGE = 7

export function OutreachesScreen() {
  const [outreaches, setOutreaches] = useState<Outreach[]>([])
  const [filters, setFilters] = useState<SearchOutreachParams>({
    location: '',
    name: '',
    operativeDate: '',
    status: '',
  })
  const [form, setForm] = useState<CreateOutreachPayload>({
    location: '',
    name: '',
    operativeDate: '',
    status: '1',
  })
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClosing, setIsClosing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingCloseOutreach, setPendingCloseOutreach] = useState<Outreach | null>(null)
  const [page, setPage] = useState(1)
  const [selectedOutreach, setSelectedOutreach] = useState<Outreach | null>(null)

  const hasPagination = outreaches.length > OUTREACHES_PER_PAGE
  const totalPages = Math.max(1, Math.ceil(outreaches.length / OUTREACHES_PER_PAGE))
  const paginatedOutreaches = outreaches.slice(
    (page - 1) * OUTREACHES_PER_PAGE,
    page * OUTREACHES_PER_PAGE,
  )
  const canSaveOutreach = Boolean(form.location.trim())

  useEffect(() => {
    let isMounted = true

    searchOutreaches({ location: '', name: '', operativeDate: '', status: '' })
      .then((data) => {
        if (isMounted) {
          setOutreaches(data)
          setError(null)
        }
      })
      .catch((apiError: unknown) => {
        if (isMounted) {
          setError(getErrorMessage(apiError))
          setOutreaches([])
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

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages))
  }, [totalPages])

  async function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (filters.operativeDate && !isValidDisplayDate(filters.operativeDate)) {
      setError('La fecha debe estar en formato dd/mm/aaaa.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await searchOutreaches(filters)
      setOutreaches(data)
      setPage(1)
    } catch (apiError) {
      setError(getErrorMessage(apiError))
      setOutreaches([])
      setPage(1)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleClearFilters() {
    setFilters({ location: '', name: '', operativeDate: '', status: '' })
    setError(null)
    setIsLoading(true)

    try {
      const data = await searchOutreaches({ location: '', name: '', operativeDate: '', status: '' })
      setOutreaches(data)
    } catch (apiError) {
      setError(getErrorMessage(apiError))
      setOutreaches([])
      setPage(1)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.location.trim()) {
      setError('La ubicación del operativo es obligatoria.')
      return
    }

    if (form.operativeDate && !isValidDisplayDate(form.operativeDate)) {
      setError('La fecha debe estar en formato dd/mm/aaaa.')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      if (editingId) {
        const updatedOutreach = await updateOutreach(editingId, form)
        setOutreaches((currentOutreaches) =>
          currentOutreaches.map((outreach) =>
            outreach.id === editingId ? updatedOutreach : outreach,
          ),
        )
      } else {
        const createdOutreach = await createOutreach(form)
        setOutreaches((currentOutreaches) => [createdOutreach, ...currentOutreaches])
        setPage(1)
      }

      resetForm()
    } catch (apiError) {
      setError(getErrorMessage(apiError))
    } finally {
      setIsSaving(false)
    }
  }

  function handleEdit(outreach: Outreach) {
    if (!outreach.id) {
      setError('Este operativo no tiene ID para actualizar.')
      return
    }

    setEditingId(outreach.id)
    setForm({
      location: outreach.location === 'Sin ubicación' ? '' : outreach.location,
      name: outreach.name === 'Operativo sin nombre' ? '' : outreach.name,
      operativeDate: outreach.date === 'Sin fecha' ? '' : outreach.date,
      status: outreach.statusValue,
    })
    setError(null)
  }

  async function handleClose(outreach: Outreach) {
    if (!outreach.id) {
      setError('Este operativo no tiene ID para cerrar.')
      setPendingCloseOutreach(null)
      return
    }

    setIsClosing(true)
    setError(null)

    try {
      const closedOutreach = await closeOutreach(outreach.id)
      setOutreaches((currentOutreaches) =>
        currentOutreaches.map((currentOutreach) =>
          currentOutreach.id === outreach.id ? closedOutreach : currentOutreach,
        ),
      )
      setSelectedOutreach((currentOutreach) =>
        currentOutreach?.id === outreach.id ? closedOutreach : currentOutreach,
      )
      if (editingId === outreach.id) {
        resetForm()
      }
      setPendingCloseOutreach(null)
    } catch (apiError) {
      setError(getErrorMessage(apiError))
    } finally {
      setIsClosing(false)
    }
  }

  async function handleDelete(outreach: Outreach) {
    if (!outreach.id) {
      setError('Este operativo no tiene ID para eliminar.')
      return
    }

    const shouldDelete = window.confirm(`¿Eliminar "${outreach.name}"?`)
    if (!shouldDelete) {
      return
    }

    setError(null)

    try {
      await deleteOutreach(outreach.id)
      setOutreaches((currentOutreaches) =>
        currentOutreaches.filter((currentOutreach) => currentOutreach.id !== outreach.id),
      )
      setSelectedOutreach((currentOutreach) =>
        currentOutreach?.id === outreach.id ? null : currentOutreach,
      )
      if (editingId === outreach.id) {
        resetForm()
      }
    } catch (apiError) {
      setError(getErrorMessage(apiError))
    }
  }

  function resetForm() {
    setEditingId(null)
    setForm({ location: '', name: '', operativeDate: '', status: '1' })
  }

  return (
    <>
      <PageHeader subtitle="Hey! Aquí están los operativos" title="Operativos" />
      {selectedOutreach ? (
        <OutreachDetailCard
          isClosing={isClosing}
          onClose={() => setSelectedOutreach(null)}
          onCloseOutreach={() => setPendingCloseOutreach(selectedOutreach)}
          onDelete={() => handleDelete(selectedOutreach)}
          onEdit={() => {
            handleEdit(selectedOutreach)
            setSelectedOutreach(null)
          }}
          outreach={selectedOutreach}
        />
      ) : null}
      {pendingCloseOutreach ? (
        <ConfirmCloseOutreachDialog
          isClosing={isClosing}
          onCancel={() => setPendingCloseOutreach(null)}
          onConfirm={() => handleClose(pendingCloseOutreach)}
          outreach={pendingCloseOutreach}
        />
      ) : null}
      <form
        className="mb-[18px] grid grid-cols-1 gap-3 rounded-[24px] border border-[rgba(255,255,255,0.78)] bg-[rgba(255,255,255,0.72)] p-3 shadow-[0_10px_28px_rgba(28,28,34,0.04)] md:grid-cols-2 xl:grid-cols-[1fr_0.9fr_1fr_0.8fr_auto_auto]"
        onSubmit={handleFilterSubmit}
      >
        <FilterInput
          label="Nombre"
          onChange={(name) => setFilters((currentFilters) => ({ ...currentFilters, name }))}
          placeholder="Operativo en bienvenido"
          value={filters.name ?? ''}
        />
        <FilterInput
          label="Fecha"
          onChange={(operativeDate) =>
            setFilters((currentFilters) => ({ ...currentFilters, operativeDate }))
          }
          placeholder="15/05/2026"
          value={filters.operativeDate ?? ''}
        />
        <FilterInput
          label="Ubicación"
          onChange={(location) => setFilters((currentFilters) => ({ ...currentFilters, location }))}
          placeholder="Santo Domingo"
          value={filters.location ?? ''}
        />
        <label className="grid gap-1.5">
          <span className="text-[11px] font-extrabold text-[var(--muted)]">Estado</span>
          <select
            className="h-11 rounded-[14px] border border-[var(--line)] bg-white px-3 text-[13px] font-bold text-[var(--ink)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(94,200,189,0.4)]"
            onChange={(event) =>
              setFilters((currentFilters) => ({
                ...currentFilters,
                status: event.target.value as SearchOutreachParams['status'],
              }))
            }
            value={filters.status}
          >
            <option value="">Todos</option>
            <option value="1">En curso</option>
            <option value="0">Cerrado</option>
          </select>
        </label>
        <div className="flex items-end">
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
          className="min-w-0 overflow-hidden rounded-[30px] border border-[rgba(255,255,255,0.78)] bg-[rgba(255,255,255,0.88)] shadow-[0_16px_44px_rgba(28,28,34,0.06)]"
          size="sm"
        >
          <TableCard.Header
            badge={`Hey! hay ${outreaches.length} operativos`}
            className="border-b border-[var(--line)] bg-white/80 px-[22px] py-[18px]"
            title="Operativos"
          />
          <div className="min-w-0 px-[22px] py-[18px]">
            {error ? <StatusMessage message={error} tone="error" /> : null}
            {isLoading ? (
              <StatusMessage message="Cargando operativos..." />
            ) : outreaches.length === 0 ? (
              <StatusMessage message="No existen registros." />
            ) : (
              <div className="h-[428px] overflow-auto">
                <Table
                  aria-label="Operativos registrados"
                  className="w-full min-w-[680px] table-fixed"
                  size="sm"
                >
                  <Table.Header>
                    <Table.Head id="name" className="w-[34%] px-4">
                      <span className="text-[11px] font-extrabold text-[var(--muted)]">Nombre</span>
                    </Table.Head>
                    <Table.Head id="location" className="w-[20%] px-4">
                      <span className="text-[11px] font-extrabold text-[var(--muted)]">
                        Ubicación
                      </span>
                    </Table.Head>
                    <Table.Head id="date" className="w-[14%] px-4">
                      <span className="text-[11px] font-extrabold text-[var(--muted)]">Fecha</span>
                    </Table.Head>
                    <Table.Head id="status" className="w-[15%] px-4">
                      <span className="text-[11px] font-extrabold text-[var(--muted)]">Estado</span>
                    </Table.Head>
                    <Table.Head id="detail" className="w-[92px] px-4">
                      <span className="block text-right text-[11px] font-extrabold text-[var(--muted)]">
                        Detalle
                      </span>
                    </Table.Head>
                  </Table.Header>
                  <Table.Body>
                    {paginatedOutreaches.map((outreach) => (
                      <OutreachRow
                        key={outreach.id ?? outreach.name}
                        onView={() => setSelectedOutreach(outreach)}
                        outreach={outreach}
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
                disabled={page === 1}
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                type="button"
                variant="secondary"
              >
                Anterior
              </Button>
              <span className="text-center text-[13px] font-bold text-[var(--muted)]">
                Página {page} de {totalPages}
              </span>
              <Button
                className="disabled:cursor-not-allowed disabled:opacity-50"
                disabled={page === totalPages}
                onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                type="button"
                variant="secondary"
              >
                Siguiente
              </Button>
            </div>
          ) : null}
        </TableCard.Root>

        <DataCard className="self-start" title={editingId ? 'Editar operativo' : 'Crear operativo'}>
          <form className="grid gap-3.5 px-[22px] pb-6 pt-[18px]" onSubmit={handleSubmit}>
            <FormField
              label="Nombre"
              onChange={(name) => setForm((currentForm) => ({ ...currentForm, name }))}
              placeholder="Operativo en comunidad"
              value={form.name}
            />
            <FormField
              label="Fecha"
              onChange={(operativeDate) =>
                setForm((currentForm) => ({ ...currentForm, operativeDate }))
              }
              placeholder="dd/mm/aaaa"
              value={form.operativeDate}
            />
            <FormField
              label="Ubicación"
              onChange={(location) => setForm((currentForm) => ({ ...currentForm, location }))}
              placeholder="Comunidad o sector"
              value={form.location}
            />
            <label className="grid gap-[7px]">
              <span className="text-xs font-extrabold text-[var(--muted)]">Estado</span>
              <select
                className="min-h-[42px] w-full rounded-[13px] border border-[var(--line)] bg-white px-3 text-[13px] text-[var(--ink)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(94,200,189,0.4)]"
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    status: event.target.value as CreateOutreachPayload['status'],
                  }))
                }
                value={form.status}
              >
                <option value="1">En curso</option>
                <option value="0">Cerrado</option>
              </select>
            </label>
            <Button
              className="gap-2 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving || !canSaveOutreach}
              type="submit"
            >
              {isSaving ? <Spinner /> : null}
              {isSaving
                ? editingId
                  ? 'Actualizando...'
                  : 'Creando...'
                : editingId
                  ? 'Actualizar'
                  : 'Guardar'}
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

function OutreachRow({ onView, outreach }: { onView: () => void; outreach: Outreach }) {
  return (
    <Table.Row id={outreach.id ?? outreach.name} className="align-top">
      <Table.Cell className="px-4 py-4 align-top">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--soft)] text-[13px] font-black text-[var(--primary-dark)]">
            {outreach.initials}
          </span>
          <div className="min-w-0">
            <strong className="block text-sm leading-5 break-words text-[var(--ink)]">
              {outreach.name}
            </strong>
            <span className="text-xs text-[var(--muted)]">ID {outreach.id ?? '-'}</span>
          </div>
        </div>
      </Table.Cell>
      <Table.Cell className="px-4 py-4 align-top text-sm leading-5 font-semibold break-words text-[var(--ink)]">
        {outreach.location}
      </Table.Cell>
      <Table.Cell className="px-4 py-4 align-top text-sm whitespace-nowrap text-[var(--muted)]">
        {outreach.date}
      </Table.Cell>
      <Table.Cell className="px-4 py-4 align-top">
        <Badge tone={outreach.tone}>{outreach.status}</Badge>
      </Table.Cell>
      <Table.Cell className="px-4 py-4 align-top">
        <div className="flex justify-end">
          <button
            aria-label={`Ver operativo ${outreach.name}`}
            className="inline-flex h-8 min-w-[72px] items-center justify-center gap-1 rounded-[9px] border border-[var(--line)] bg-white px-2 text-[10px] font-bold whitespace-nowrap text-[var(--primary-dark)] transition hover:border-[var(--accent)] hover:bg-[var(--soft)]"
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

function OutreachDetailCard({
  isClosing,
  onClose,
  onCloseOutreach,
  onDelete,
  onEdit,
  outreach,
}: {
  isClosing: boolean
  onClose: () => void
  onCloseOutreach: () => void
  onDelete: () => void
  onEdit: () => void
  outreach: Outreach
}) {
  const isClosed = outreach.statusValue === '0'

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-[rgba(32,44,42,0.28)] px-4 py-6 backdrop-blur-[2px]">
      <section className="w-full max-w-[560px] overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.88)] bg-white shadow-[0_24px_80px_rgba(28,28,34,0.22)]">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[var(--soft)] text-[14px] font-black text-[var(--primary-dark)]">
              {outreach.initials}
            </span>
            <div className="min-w-0">
              <h2 className="m-0 truncate text-lg font-bold text-[var(--ink)]">{outreach.name}</h2>
              <p className="m-0 text-xs font-semibold text-[var(--muted)]">
                ID {outreach.id ?? '-'}
              </p>
            </div>
          </div>
          <button
            aria-label="Cerrar detalle"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-[var(--line)] bg-white text-[var(--muted)]"
            onClick={onClose}
            type="button"
          >
            <XClose className="size-4" />
          </button>
        </div>

        <div className="grid gap-3 px-5 py-5 sm:grid-cols-2">
          <DetailItem label="Nombre" value={outreach.name} />
          <DetailItem
            label="Estado"
            value={<Badge tone={outreach.tone}>{outreach.status}</Badge>}
          />
          <DetailItem label="Ubicación" value={outreach.location} />
          <DetailItem label="Fecha" value={outreach.date} />
        </div>

        <div className="flex flex-col gap-2 border-t border-[var(--line)] bg-[var(--bg)] px-5 py-4 sm:flex-row sm:justify-end">
          <Button onClick={onEdit} type="button" variant="secondary">
            Editar
          </Button>
          <Button
            className="gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isClosed || isClosing}
            onClick={onCloseOutreach}
            type="button"
            variant="secondary"
          >
            {isClosing ? <Spinner tone="primary" /> : null}
            {isClosing ? 'Cerrando...' : 'Cerrar operativo'}
          </Button>
          <button
            className="inline-flex min-h-[38px] items-center justify-center rounded-[10px] border border-[var(--rose)] bg-[var(--rose)] px-[18px] text-[13px] font-extrabold text-[#884a45] transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(94,200,189,0.4)]"
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

function ConfirmCloseOutreachDialog({
  isClosing,
  onCancel,
  onConfirm,
  outreach,
}: {
  isClosing: boolean
  onCancel: () => void
  onConfirm: () => void
  outreach: Outreach
}) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-[rgba(32,44,42,0.32)] px-4 py-6 backdrop-blur-[2px]">
      <section className="w-full max-w-[420px] rounded-[24px] border border-[rgba(255,255,255,0.9)] bg-white p-5 shadow-[0_24px_70px_rgba(28,28,34,0.24)]">
        <h2 className="m-0 text-lg font-bold text-[var(--ink)]">Cerrar operativo</h2>
        <p className="mb-0 mt-2 text-sm font-semibold text-[var(--muted)]">
          ¿Seguro que quieres cerrar "{outreach.name}"? Esta acción cambiará su estado a cerrado.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button disabled={isClosing} onClick={onCancel} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button
            className="gap-2 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isClosing}
            onClick={onConfirm}
            type="button"
          >
            {isClosing ? <Spinner /> : null}
            {isClosing ? 'Cerrando...' : 'Confirmar'}
          </Button>
        </div>
      </section>
    </div>
  )
}

function Spinner({ tone = 'light' }: { tone?: 'light' | 'primary' }) {
  return (
    <span
      aria-hidden="true"
      className={
        tone === 'primary'
          ? 'h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent'
          : 'h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent'
      }
    />
  )
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-[16px] border border-[var(--line)] bg-[var(--soft)] px-4 py-3">
      <span className="mb-1 block text-[11px] font-extrabold text-[var(--muted)]">{label}</span>
      <div className="text-sm font-bold break-words text-[var(--ink)]">{value}</div>
    </div>
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
      <span className="text-[11px] font-extrabold text-[var(--muted)]">{label}</span>
      <input
        className="h-11 rounded-[14px] border border-[var(--line)] bg-white px-3 text-[13px] font-bold text-[var(--ink)] placeholder:text-[var(--muted)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(94,200,189,0.4)]"
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

function getErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : 'No se pudo completar la llamada al backend.'

  return mapApiErrorMessage(message)
}

function mapApiErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes('operativedate must use dd/mm/yyyy format')) {
    return 'La fecha del operativo debe estar en formato dd/mm/aaaa.'
  }

  if (normalizedMessage.includes('operativedate')) {
    return 'Revisa la fecha del operativo. Debe estar en formato dd/mm/aaaa.'
  }

  return message
}

function isValidDisplayDate(value: string) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return false
  }

  const [day, month, year] = value.split('/').map(Number)
  const date = new Date(year, month - 1, day)

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}
