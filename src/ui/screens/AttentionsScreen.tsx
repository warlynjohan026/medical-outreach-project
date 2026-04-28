import { useEffect, useState, type FormEvent } from 'react'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { DataCard } from '../components/DataCard'
import { FormField } from '../components/FormField'
import { PageHeader } from '../components/PageHeader'
import {
  createAttention,
  deleteAttention,
  getAttentions,
  searchAttentions,
  updateAttention,
} from '../services/attentionsService'
import type { Attention, CreateAttentionPayload, SearchAttentionParams } from '../types'

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
    id: '',
    medication: '',
    operativeId: '',
    patientId: '',
  })
  const [form, setForm] = useState<CreateAttentionPayload>(emptyAttentionForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

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
      const hasFilters = Object.values(filters).some((value) => value?.trim())
      const data = hasFilters ? await searchAttentions(filters) : await getAttentions()
      setAttentions(data)
    } catch (apiError) {
      setError(getErrorMessage(apiError))
      setAttentions([])
    } finally {
      setIsLoading(false)
    }
  }

  async function handleClearFilters() {
    setFilters({
      attentionDate: '',
      doctor: '',
      id: '',
      medication: '',
      operativeId: '',
      patientId: '',
    })
    setError(null)
    setIsLoading(true)

    try {
      const data = await getAttentions()
      setAttentions(data)
    } catch (apiError) {
      setError(getErrorMessage(apiError))
      setAttentions([])
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isValidDisplayDate(form.attentionDate)) {
      setError('La fecha de atención debe estar en formato dd/mm/aaaa.')
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
      <form
        className="mb-[18px] grid grid-cols-1 gap-3 rounded-[24px] border border-[rgba(255,255,255,0.78)] bg-[rgba(255,255,255,0.72)] p-3 shadow-[0_10px_28px_rgba(28,28,34,0.04)] md:grid-cols-[0.6fr_0.8fr_0.8fr_1fr_1fr_0.9fr_auto_auto]"
        onSubmit={handleFilterSubmit}
      >
        <FilterInput
          label="ID"
          onChange={(id) => setFilters((currentFilters) => ({ ...currentFilters, id }))}
          placeholder="1"
          value={filters.id ?? ''}
        />
        <FilterInput
          label="Paciente"
          onChange={(patientId) =>
            setFilters((currentFilters) => ({ ...currentFilters, patientId }))
          }
          placeholder="1"
          value={filters.patientId ?? ''}
        />
        <FilterInput
          label="Operativo"
          onChange={(operativeId) =>
            setFilters((currentFilters) => ({ ...currentFilters, operativeId }))
          }
          placeholder="1"
          value={filters.operativeId ?? ''}
        />
        <FilterInput
          label="Médico"
          onChange={(doctor) => setFilters((currentFilters) => ({ ...currentFilters, doctor }))}
          placeholder="María"
          value={filters.doctor ?? ''}
        />
        <FilterInput
          label="Medicamento"
          onChange={(medication) =>
            setFilters((currentFilters) => ({ ...currentFilters, medication }))
          }
          placeholder="Acetaminofén"
          value={filters.medication ?? ''}
        />
        <FilterInput
          label="Fecha"
          onChange={(attentionDate) =>
            setFilters((currentFilters) => ({ ...currentFilters, attentionDate }))
          }
          placeholder="15/05/2026"
          value={filters.attentionDate ?? ''}
        />
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
        <DataCard title="Atenciones recientes">
          <div className="grid gap-3 px-[22px] pb-6 pt-[18px]">
            {isLoading ? (
              <StatusMessage message="Cargando atenciones..." />
            ) : (
              <>
                {error ? <StatusMessage message={error} tone="error" /> : null}
                {attentions.length === 0 ? (
                  <StatusMessage message="No existen registros." />
                ) : (
                  attentions.map((attention) => (
                    <AttentionRow
                      attention={attention}
                      key={attention.id ?? `${attention.patientId}-${attention.date}`}
                      onDelete={() => handleDelete(attention)}
                      onEdit={() => handleEdit(attention)}
                    />
                  ))
                )}
              </>
            )}
          </div>
        </DataCard>

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
              className="disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? 'Guardando...' : editingId ? 'Actualizar atención' : 'Guardar atención'}
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

function AttentionRow({
  attention,
  onDelete,
  onEdit,
}: {
  attention: Attention
  onDelete: () => void
  onEdit: () => void
}) {
  return (
    <article className="grid gap-3 rounded-[18px] border border-[var(--line)] bg-white px-3.5 py-3 sm:grid-cols-[46px_minmax(0,1fr)_auto] sm:items-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[var(--soft)] text-[13px] font-black text-[var(--primary-dark)]">
        {attention.day}
      </span>
      <div className="min-w-0">
        <strong className="mb-1 block truncate text-sm text-[var(--ink)]">
          {attention.patient}
        </strong>
        <span className="block truncate text-xs text-[var(--muted)]">
          {attention.doctor} | {attention.medication} | {attention.date}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={attention.tone}>{attention.status}</Badge>
        <button
          className="rounded-[9px] border border-[var(--line)] bg-white px-3 py-2 text-[12px] font-extrabold text-[var(--primary-dark)]"
          onClick={onEdit}
          type="button"
        >
          Editar
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

function isValidDisplayDate(value: string) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return false
  }

  const [day, month, year] = value.split('/').map(Number)
  const date = new Date(year, month - 1, day)

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'No se pudo completar la llamada al backend.'
}
