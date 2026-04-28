import { Eye, XClose } from '@untitledui/icons'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Button } from '../components/Button'
import { DataCard } from '../components/DataCard'
import { FormField } from '../components/FormField'
import { PageHeader } from '../components/PageHeader'
import { Table, TableCard } from '../components/untitledui/application/table/table'
import {
  createPatient,
  deletePatient,
  getPatients,
  searchPatients,
  updatePatient,
} from '../services/patientsService'
import type { CreatePatientPayload, Patient, SearchPatientParams } from '../types'

const PATIENTS_PER_PAGE = 7

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
  const [page, setPage] = useState(1)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  const hasPagination = patients.length > PATIENTS_PER_PAGE
  const totalPages = Math.max(1, Math.ceil(patients.length / PATIENTS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginatedPatients = patients.slice(
    (currentPage - 1) * PATIENTS_PER_PAGE,
    currentPage * PATIENTS_PER_PAGE,
  )
  const canSavePatient = Boolean(
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.taxId.trim() &&
    form.birthDate.trim() &&
    form.phoneNumber.trim() &&
    form.address.trim(),
  )

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
      setPage(1)
    } catch (apiError) {
      setError(getErrorMessage(apiError))
      setPatients([])
      setPage(1)
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
      setPage(1)
    } catch (apiError) {
      setError(getErrorMessage(apiError))
      setPatients([])
      setPage(1)
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
        setPage(1)
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
      birthDate: patient.birthDate === 'Sin fecha' ? '' : patient.birthDate,
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
      setSelectedPatient((currentPatient) =>
        currentPatient?.id === patient.id ? null : currentPatient,
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
      <PageHeader
        subtitle="Hey! Aquí puedes encontrar todas las personas que atiendes."
        title="Pacientes"
      />
      {selectedPatient ? (
        <PatientDetailCard
          onClose={() => setSelectedPatient(null)}
          onDelete={() => handleDelete(selectedPatient)}
          onEdit={() => {
            handleEdit(selectedPatient)
            setSelectedPatient(null)
          }}
          patient={selectedPatient}
        />
      ) : null}
      <form
        className="motion-card motion-stagger mb-[18px] grid grid-cols-1 gap-3 rounded-[24px] border border-[rgba(255,255,255,0.78)] bg-[rgba(255,255,255,0.72)] p-3 shadow-[0_10px_28px_rgba(28,28,34,0.04)] md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto_auto]"
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

      <section className="grid min-w-0 grid-cols-1 gap-[22px] lg:grid-cols-[minmax(0,1fr)_340px]">
        <TableCard.Root
          className="motion-card min-w-0 self-start overflow-hidden rounded-[30px] border border-[rgba(255,255,255,0.78)] bg-[rgba(255,255,255,0.88)] shadow-[0_16px_44px_rgba(28,28,34,0.06)]"
          size="sm"
        >
          <TableCard.Header
            badge={`Hey! hay ${patients.length} pacientes`}
            className="border-b border-[var(--line)] bg-white/80 px-[22px] py-[18px]"
            title="Directorio de pacientes"
          />
          <div className="min-w-0 px-[22px] py-[18px]">
            {error ? <StatusMessage message={error} tone="error" /> : null}
            {isLoading ? (
              <StatusMessage message="Cargando pacientes..." />
            ) : patients.length === 0 ? (
              <StatusMessage message="No existen registros." />
            ) : (
              <div className="h-[466px] overflow-auto">
                <Table
                  aria-label="Pacientes registrados"
                  className="w-full min-w-[760px] table-fixed"
                  size="sm"
                >
                  <Table.Header>
                    <Table.Head id="name" className="w-[28%] px-4">
                      <span className="text-[12px] font-extrabold text-[var(--muted)]">Nombre</span>
                    </Table.Head>
                    <Table.Head id="document" className="w-[18%] px-4">
                      <span className="text-[12px] font-extrabold text-[var(--muted)]">Cédula</span>
                    </Table.Head>
                    <Table.Head id="phone" className="w-[16%] px-4">
                      <span className="text-[12px] font-extrabold text-[var(--muted)]">
                        Teléfono
                      </span>
                    </Table.Head>
                    <Table.Head id="bloodType" className="w-[20%] px-4">
                      <span className="text-[12px] font-extrabold text-[var(--muted)]">
                        Tipo de sangre
                      </span>
                    </Table.Head>
                    <Table.Head id="detail" className="w-[92px] px-4">
                      <span className="block text-right text-[12px] font-extrabold text-[var(--muted)]">
                        Detalle
                      </span>
                    </Table.Head>
                  </Table.Header>
                  <Table.Body>
                    {paginatedPatients.map((patient) => (
                      <PatientRow
                        key={patient.id ?? patient.document}
                        onView={() => setSelectedPatient(patient)}
                        patient={patient}
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

        <DataCard className="self-start" title={editingId ? 'Editar paciente' : 'Agregar Paciente'}>
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
                className="min-h-[42px] w-full rounded-[13px] border border-[var(--line)] bg-white px-3 text-[13px] text-[var(--ink)] hover:border-[var(--line-strong)] focus:border-[var(--accent)] focus:shadow-[0_0_0_4px_rgba(94,200,189,0.12)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(94,200,189,0.4)]"
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
              className="gap-2 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving || !canSavePatient}
              type="submit"
            >
              {isSaving ? <Spinner /> : null}
              {isSaving
                ? editingId
                  ? 'Actualizando...'
                  : 'Creando...'
                : editingId
                  ? 'Actualizar paciente'
                  : 'Guardar paciente'}
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

function PatientRow({ onView, patient }: { onView: () => void; patient: Patient }) {
  return (
    <Table.Row id={patient.id ?? patient.document} className="motion-row align-top">
      <Table.Cell className="px-4 py-4 align-top">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--soft)] text-[13px] font-black text-[var(--primary-dark)]">
            {patient.initials}
          </span>
          <div className="min-w-0">
            <span className="block text-sm leading-5 break-words text-[var(--ink)]">
              {patient.name}
            </span>
            <span className="text-xs text-[var(--muted)]">ID {patient.id ?? '-'}</span>
          </div>
        </div>
      </Table.Cell>
      <Table.Cell className="px-4 py-4 align-top text-sm break-words text-[var(--ink)]">
        {patient.document}
      </Table.Cell>
      <Table.Cell className="px-4 py-4 align-top text-sm whitespace-nowrap text-[var(--muted)]">
        {patient.phone}
      </Table.Cell>
      <Table.Cell className="px-4 py-4 align-top text-sm break-words text-[var(--ink)]">
        {getDisplayValue(patient.bloodType, 'No registrado')}
      </Table.Cell>
      <Table.Cell className="px-4 py-4 align-top">
        <div className="flex justify-end">
          <button
            aria-label={`Ver paciente ${patient.name}`}
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

function PatientDetailCard({
  onClose,
  onDelete,
  onEdit,
  patient,
}: {
  onClose: () => void
  onDelete: () => void
  onEdit: () => void
  patient: Patient
}) {
  return (
    <div className="modal-scrim fixed inset-0 z-30 grid place-items-center bg-[rgba(32,44,42,0.28)] px-4 py-6 backdrop-blur-[2px]">
      <section className="modal-panel w-full max-w-[620px] overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.88)] bg-white shadow-[0_24px_80px_rgba(28,28,34,0.22)]">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[var(--soft)] text-[14px] font-black text-[var(--primary-dark)]">
              {patient.initials}
            </span>
            <div className="min-w-0">
              <h2 className="m-0 truncate text-lg font-bold text-[var(--ink)]">{patient.name}</h2>
              <p className="m-0 text-xs font-semibold text-[var(--muted)]">
                ID {patient.id ?? '-'}
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
          <DetailItem label="Nombre" value={patient.firstName} />
          <DetailItem label="Apellido" value={patient.lastName || 'Sin apellido'} />
          <DetailItem label="Cédula" value={patient.document} />
          <DetailItem label="Fecha nacimiento" value={patient.birthDate} />
          <DetailItem label="Teléfono" value={patient.phone} />
          <DetailItem label="Dirección" value={patient.address} />
          <DetailItem
            label="Tipo de sangre"
            value={getDisplayValue(patient.bloodType, 'No registrado')}
          />
          <DetailItem label="Alergias" value={patient.allergies} />
          <DetailItem label="Condición médica" value={patient.condition} />
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

function getDisplayValue(value: string, fallback: string) {
  return value.trim() ? value : fallback
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

function validatePatientForm(form: CreatePatientPayload) {
  if (!form.firstName.trim()) {
    return 'El nombre del paciente es obligatorio.'
  }

  if (!form.lastName.trim()) {
    return 'El apellido del paciente es obligatorio.'
  }

  if (!form.taxId.trim()) {
    return 'La cédula del paciente es obligatoria.'
  }

  if (!/^\d{11}$/.test(form.taxId)) {
    return 'La cédula debe tener exactamente 11 números.'
  }

  if (!form.birthDate.trim()) {
    return 'La fecha de nacimiento es obligatoria.'
  }

  if (!isValidDisplayDate(form.birthDate)) {
    return 'La fecha de nacimiento debe estar en formato dd/mm/aaaa.'
  }

  if (!form.phoneNumber.trim()) {
    return 'El teléfono del paciente es obligatorio.'
  }

  if (!/^\d{10}$/.test(form.phoneNumber)) {
    return 'El teléfono debe tener exactamente 10 números.'
  }

  if (!form.address.trim()) {
    return 'La dirección del paciente es obligatoria.'
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
  const message =
    error instanceof Error ? error.message : 'No se pudo completar la llamada al backend.'

  return mapApiErrorMessage(message)
}

function mapApiErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes('birthdate') && normalizedMessage.includes('dd/mm/yyyy')) {
    return 'La fecha de nacimiento debe estar en formato dd/mm/aaaa.'
  }

  if (normalizedMessage.includes('phonenumber')) {
    return 'Revisa el teléfono del paciente. Debe tener exactamente 10 números.'
  }

  if (normalizedMessage.includes('taxid')) {
    return 'Revisa la cédula del paciente. Debe tener exactamente 11 números.'
  }

  if (normalizedMessage.includes('firstname')) {
    return 'Revisa el nombre del paciente.'
  }

  if (normalizedMessage.includes('lastname')) {
    return 'Revisa el apellido del paciente.'
  }

  return message
}
