import { useEffect, useState, type FormEvent } from 'react'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { DataCard } from '../components/DataCard'
import { FormField } from '../components/FormField'
import { PageHeader } from '../components/PageHeader'
import {
  closeOutreach,
  createOutreach,
  deleteOutreach,
  getOutreaches,
  searchOutreaches,
  updateOutreach,
} from '../services/outreachesService'
import type { CreateOutreachPayload, Outreach, SearchOutreachParams } from '../types'

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
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let isMounted = true

    getOutreaches()
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

  async function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (filters.operativeDate && !isValidDisplayDate(filters.operativeDate)) {
      setError('La fecha debe estar en formato dd/mm/aaaa.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const hasFilters = Object.values(filters).some((value) => value?.trim())
      const data = hasFilters ? await searchOutreaches(filters) : await getOutreaches()
      setOutreaches(data)
    } catch (apiError) {
      setError(getErrorMessage(apiError))
      setOutreaches([])
    } finally {
      setIsLoading(false)
    }
  }

  async function handleClearFilters() {
    setFilters({ location: '', name: '', operativeDate: '', status: '' })
    setError(null)
    setIsLoading(true)

    try {
      const data = await getOutreaches()
      setOutreaches(data)
    } catch (apiError) {
      setError(getErrorMessage(apiError))
      setOutreaches([])
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

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
      return
    }

    setError(null)

    try {
      const closedOutreach = await closeOutreach(outreach.id)
      setOutreaches((currentOutreaches) =>
        currentOutreaches.map((currentOutreach) =>
          currentOutreach.id === outreach.id ? closedOutreach : currentOutreach,
        ),
      )
      if (editingId === outreach.id) {
        resetForm()
      }
    } catch (apiError) {
      setError(getErrorMessage(apiError))
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
      <PageHeader subtitle="Jornadas médicas por comunidad, fecha y estado." title="Operativos" />
      <form
        className="mb-[18px] grid grid-cols-1 gap-3 rounded-[24px] border border-[rgba(255,255,255,0.78)] bg-[rgba(255,255,255,0.72)] p-3 shadow-[0_10px_28px_rgba(28,28,34,0.04)] md:grid-cols-[1fr_0.9fr_1fr_0.8fr_auto_auto]"
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

      <section className="grid grid-cols-1 gap-[22px] lg:grid-cols-[minmax(0,1fr)_340px]">
        <DataCard title="Operativos">
          <div className="grid gap-3 px-[22px] pb-6 pt-[18px]">
            {isLoading ? (
              <StatusMessage message="Cargando operativos..." />
            ) : (
              <>
                {error ? <StatusMessage message={error} tone="error" /> : null}
                {outreaches.length === 0 ? (
                  <StatusMessage message="No existen registros." />
                ) : (
                  outreaches.map((outreach) => (
                    <OutreachRow
                      key={outreach.id ?? outreach.name}
                      onClose={() => handleClose(outreach)}
                      onDelete={() => handleDelete(outreach)}
                      onEdit={() => handleEdit(outreach)}
                      outreach={outreach}
                    />
                  ))
                )}
              </>
            )}
          </div>
        </DataCard>

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
              className="disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar'}
            </Button>
            {editingId ? (
              <Button onClick={resetForm} type="button" variant="secondary">
                Cancelar edición
              </Button>
            ) : null}
          </form>
        </DataCard>
      </section>
    </>
  )
}

function OutreachRow({
  onClose,
  onDelete,
  onEdit,
  outreach,
}: {
  onClose: () => void
  onDelete: () => void
  onEdit: () => void
  outreach: Outreach
}) {
  const isClosed = outreach.statusValue === '0'

  return (
    <article className="grid gap-3 rounded-[18px] border border-[var(--line)] bg-white px-3.5 py-3 sm:grid-cols-[46px_minmax(0,1fr)_auto] sm:items-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[var(--soft)] text-[13px] font-black text-[var(--primary-dark)]">
        {outreach.initials}
      </span>
      <div className="min-w-0">
        <strong className="mb-1 block truncate text-sm text-[var(--ink)]">{outreach.name}</strong>
        <span className="block truncate text-xs text-[var(--muted)]">
          {outreach.location} | {outreach.date}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={outreach.tone}>{outreach.status}</Badge>
        <button
          className="rounded-[9px] border border-[var(--line)] bg-white px-3 py-2 text-[12px] font-extrabold text-[var(--primary-dark)]"
          onClick={onEdit}
          type="button"
        >
          Editar
        </button>
        <button
          className="rounded-[9px] border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-[12px] font-extrabold text-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isClosed}
          onClick={onClose}
          type="button"
        >
          Cerrar
        </button>
        <button
          className="rounded-[9px] border border-[var(--rose)] bg-[var(--rose)] px-3 py-2 text-[12px] font-extrabold text-[#884a45]"
          onClick={onDelete}
          type="button"
        >
          Eliminar
        </button>
      </div>
    </article>
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
          ? 'rounded-[18px] border border-[var(--rose)] bg-[var(--rose)] px-4 py-3 text-[13px] font-bold text-[#884a45]'
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

function isValidDisplayDate(value: string) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return false
  }

  const [day, month, year] = value.split('/').map(Number)
  const date = new Date(year, month - 1, day)

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}
