import { useEffect, useState, type FormEvent } from 'react'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { DataCard } from '../components/DataCard'
import { FormField } from '../components/FormField'
import { PageHeader } from '../components/PageHeader'
import {
  createPatient,
  deletePatient,
  getPatients,
  searchPatients,
  updatePatient,
} from '../services/patientsService'
import type { CreatePatientPayload, Patient, SearchPatientParams } from '../types'

const emptyPatientForm: CreatePatientPayload = {
  address: '',
  allergies: false,
  birthDate: '',
  bloodType: '',
  firstName: '',
  lastName: '',
  medicalConditions: '',
  phoneNumber: '',
  taxId: '',
}

export function PatientsScreen() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [filters, setFilters] = useState<SearchPatientParams>({
    firstName: '',
    id: '',
    lastName: '',
    taxId: '',
  })
  const [form, setForm] = useState<CreatePatientPayload>(emptyPatientForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let isMounted = true

    getPatients()
      .then((data) => {
        if (isMounted) {
          setPatients(data)
          setError(null)
        }
      })
      .catch((apiError: unknown) => {
        if (isMounted) {
          setError(getErrorMessage(apiError))
          setPatients([])
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
    setIsLoading(true)
    setError(null)

    try {
      const hasFilters = Object.values(filters).some((value) => value?.trim())
      const data = hasFilters ? await searchPatients(filters) : await getPatients()
      setPatients(data)
    } catch (apiError) {
      setError(getErrorMessage(apiError))
      setPatients([])
    } finally {
      setIsLoading(false)
    }
  }

  async function handleClearFilters() {
    setFilters({ firstName: '', id: '', lastName: '', taxId: '' })
    setError(null)
    setIsLoading(true)

    try {
      const data = await getPatients()
      setPatients(data)
    } catch (apiError) {
      setError(getErrorMessage(apiError))
      setPatients([])
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationError = validatePatientForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      if (editingId) {
        const updatedPatient = await updatePatient(editingId, form)
        setPatients((currentPatients) =>
          currentPatients.map((patient) => (patient.id === editingId ? updatedPatient : patient)),
        )
      } else {
        const createdPatient = await createPatient(form)
        setPatients((currentPatients) => [createdPatient, ...currentPatients])
      }

      resetForm()
    } catch (apiError) {
      setError(getErrorMessage(apiError))
    } finally {
      setIsSaving(false)
    }
  }

  function handleEdit(patient: Patient) {
    if (!patient.id) {
      setError('Este paciente no tiene ID para actualizar.')
      return
    }

    setEditingId(patient.id)
    setForm({
      address: patient.address === 'Sin dirección' ? '' : patient.address,
      allergies: patient.allergies === 'Sí',
      birthDate: '',
      bloodType: patient.bloodType === 'No registrado' ? '' : patient.bloodType,
      firstName: patient.firstName,
      lastName: patient.lastName,
      medicalConditions: patient.condition === 'Ninguna' ? '' : patient.condition,
      phoneNumber: patient.phone === 'Sin teléfono' ? '' : patient.phone,
      taxId: patient.document === 'Sin documento' ? '' : patient.document,
    })
    setError(null)
  }

  async function handleDelete(patient: Patient) {
    if (!patient.id) {
      setError('Este paciente no tiene ID para eliminar.')
      return
    }

    const shouldDelete = window.confirm(`¿Eliminar "${patient.name}"?`)
    if (!shouldDelete) {
      return
    }

    setError(null)

    try {
      await deletePatient(patient.id)
      setPatients((currentPatients) =>
        currentPatients.filter((currentPatient) => currentPatient.id !== patient.id),
      )
      if (editingId === patient.id) {
        resetForm()
      }
    } catch (apiError) {
      setError(getErrorMessage(apiError))
    }
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyPatientForm)
  }

  return (
    <>
      <PageHeader subtitle="Registro de beneficiarios para seguimiento médico." title="Pacientes" />
      <form
        className="mb-[18px] grid grid-cols-1 gap-3 rounded-[24px] border border-[rgba(255,255,255,0.78)] bg-[rgba(255,255,255,0.72)] p-3 shadow-[0_10px_28px_rgba(28,28,34,0.04)] md:grid-cols-[0.6fr_1fr_1fr_1fr_auto_auto]"
        onSubmit={handleFilterSubmit}
      >
        <FilterInput
          label="Nombre"
          onChange={(firstName) =>
            setFilters((currentFilters) => ({ ...currentFilters, firstName }))
          }
          placeholder="Juan"
          value={filters.firstName ?? ''}
        />
        <FilterInput
          label="Apellido"
          onChange={(lastName) => setFilters((currentFilters) => ({ ...currentFilters, lastName }))}
          placeholder="Pérez"
          value={filters.lastName ?? ''}
        />
        <FilterInput
          label="Cédula"
          onChange={(taxId) => setFilters((currentFilters) => ({ ...currentFilters, taxId }))}
          placeholder="00112345678"
          value={filters.taxId ?? ''}
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
        <DataCard title="Directorio de pacientes">
          <div className="grid gap-3 px-[22px] pb-6 pt-[18px]">
            {isLoading ? (
              <StatusMessage message="Cargando pacientes..." />
            ) : (
              <>
                {error ? <StatusMessage message={error} tone="error" /> : null}
                {patients.length === 0 ? (
                  <StatusMessage message="No existen registros." />
                ) : (
                  patients.map((patient) => (
                    <PatientRow
                      key={patient.id ?? patient.document}
                      onDelete={() => handleDelete(patient)}
                      onEdit={() => handleEdit(patient)}
                      patient={patient}
                    />
                  ))
                )}
              </>
            )}
          </div>
        </DataCard>

        <DataCard className="self-start" title={editingId ? 'Editar paciente' : 'Ficha rápida'}>
          <form className="grid gap-3.5 px-[22px] pb-6 pt-[18px]" onSubmit={handleSubmit}>
            <FormField
              label="Nombre"
              onChange={(firstName) => setForm((currentForm) => ({ ...currentForm, firstName }))}
              placeholder="Juan"
              value={form.firstName}
            />
            <FormField
              label="Apellido"
              onChange={(lastName) => setForm((currentForm) => ({ ...currentForm, lastName }))}
              placeholder="Pérez"
              value={form.lastName}
            />
            <FormField
              label="Cédula"
              onChange={(taxId) => setForm((currentForm) => ({ ...currentForm, taxId }))}
              placeholder="00112345678"
              value={form.taxId}
            />
            <FormField
              label="Fecha nacimiento"
              onChange={(birthDate) => setForm((currentForm) => ({ ...currentForm, birthDate }))}
              placeholder="dd/mm/aaaa"
              value={form.birthDate}
            />
            <FormField
              label="Teléfono"
              onChange={(phoneNumber) =>
                setForm((currentForm) => ({ ...currentForm, phoneNumber }))
              }
              placeholder="8095551234"
              value={form.phoneNumber}
            />
            <FormField
              label="Dirección"
              onChange={(address) => setForm((currentForm) => ({ ...currentForm, address }))}
              placeholder="Av. Duarte #45"
              value={form.address}
            />
            <FormField
              label="Tipo sangre"
              onChange={(bloodType) => setForm((currentForm) => ({ ...currentForm, bloodType }))}
              placeholder="O+"
              value={form.bloodType}
            />
            <label className="grid gap-[7px]">
              <span className="text-xs font-extrabold text-[var(--muted)]">Alergias</span>
              <select
                className="min-h-[42px] w-full rounded-[13px] border border-[var(--line)] bg-white px-3 text-[13px] text-[var(--ink)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(94,200,189,0.4)]"
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    allergies: event.target.value === 'true',
                  }))
                }
                value={form.allergies ? 'true' : 'false'}
              >
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>
            </label>
            <FormField
              label="Condición médica"
              onChange={(medicalConditions) =>
                setForm((currentForm) => ({ ...currentForm, medicalConditions }))
              }
              placeholder="Hipertensión"
              value={form.medicalConditions}
            />
            <Button
              className="disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? 'Guardando...' : editingId ? 'Actualizar paciente' : 'Guardar paciente'}
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

function PatientRow({
  onDelete,
  onEdit,
  patient,
}: {
  onDelete: () => void
  onEdit: () => void
  patient: Patient
}) {
  return (
    <article className="grid gap-3 rounded-[18px] border border-[var(--line)] bg-white px-3.5 py-3 sm:grid-cols-[46px_minmax(0,1fr)_auto] sm:items-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[var(--soft)] text-[13px] font-black text-[var(--primary-dark)]">
        {patient.initials}
      </span>
      <div className="min-w-0">
        <strong className="mb-1 block truncate text-sm text-[var(--ink)]">{patient.name}</strong>
        <span className="block truncate text-xs text-[var(--muted)]">
          {patient.document} | {patient.phone}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={patient.tone}>{patient.condition}</Badge>
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

function validatePatientForm(form: CreatePatientPayload) {
  if (!isValidDisplayDate(form.birthDate)) {
    return 'La fecha de nacimiento debe estar en formato dd/mm/aaaa.'
  }

  if (!/^\d{10}$/.test(form.phoneNumber)) {
    return 'El teléfono debe tener exactamente 10 números.'
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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'No se pudo completar la llamada al backend.'
}
