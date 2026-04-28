import type { Attention, Metric, Outreach, Patient, ReportOption, Screen } from '../types'

export const screens: Screen[] = ['Inicio', 'Operativos', 'Pacientes', 'Atenciones', 'Reportes']

export const primaryActions: Record<Screen, string> = {
  Inicio: 'Nuevo operativo',
  Operativos: 'Nuevo operativo',
  Pacientes: 'Nuevo paciente',
  Atenciones: 'Nueva atención',
  Reportes: 'Exportar',
}

export const metrics: Metric[] = [
  { value: '3', label: 'Operativos activos', tone: 'primary' },
  { value: '1,332', label: 'Pacientes', tone: 'accent' },
  { value: '248', label: 'Atenciones', tone: 'warning' },
  { value: '6', label: 'Reportes', tone: 'coral' },
]

export const outreaches: Outreach[] = [
  {
    initials: 'JA',
    name: 'Jornada Batey Aleman',
    location: 'San Pedro de Macoris',
    date: '27/04/2026',
    status: 'Activo',
    statusValue: '1',
    tone: 'soft',
  },
  {
    initials: 'CF',
    name: 'Chequeo familiar',
    location: 'Batey Aleman',
    date: '24/04/2026',
    status: 'Activo',
    statusValue: '1',
    tone: 'soft',
  },
  {
    initials: 'SP',
    name: 'Seguimiento pediátrico',
    location: 'Centro comunitario',
    date: '18/04/2026',
    status: 'Cerrado',
    statusValue: '0',
    tone: 'sun',
  },
]

export const patients: Patient[] = [
  {
    firstName: 'Ana',
    initials: 'AP',
    lastName: 'Perez',
    name: 'Ana Perez',
    document: '00112345678',
    phone: '8095550134',
    address: 'Batey Aleman',
    bloodType: 'O+',
    birthDate: '12/04/1984',
    allergies: 'Ninguna registrada',
    condition: 'Hipertensión',
    tone: 'sun',
  },
  {
    firstName: 'Luis',
    initials: 'LR',
    lastName: 'Rodriguez',
    name: 'Luis Rodriguez',
    document: '00187654321',
    phone: '8095550188',
    address: 'San Pedro',
    bloodType: 'A+',
    birthDate: '08/09/1978',
    allergies: 'Polvo',
    condition: 'Ninguna',
    tone: 'soft',
  },
  {
    firstName: 'Maria',
    initials: 'MG',
    lastName: 'Garcia',
    name: 'Maria Garcia',
    document: '00144556677',
    phone: '8095550112',
    address: 'Centro comunitario',
    bloodType: 'B+',
    birthDate: '21/01/1992',
    allergies: 'Alergias',
    condition: 'Alergias',
    tone: 'rose',
  },
]

export const attentions: Attention[] = [
  {
    day: '27',
    patient: 'Ana Perez',
    doctor: 'Dra. Santos',
    medication: 'Acetaminofen',
    date: '27/04/2026',
    operative: 'Jornada Batey Aleman',
    operativeId: '1',
    status: 'Hoy',
    patientId: '1',
    tone: 'sun',
  },
  {
    day: '27',
    patient: 'Luis Rodriguez',
    doctor: 'Dr. Peña',
    medication: 'Loratadina',
    date: '27/04/2026',
    operative: 'Jornada Batey Aleman',
    operativeId: '1',
    status: 'Hoy',
    patientId: '2',
    tone: 'soft',
  },
  {
    day: '24',
    patient: 'Maria Garcia',
    doctor: 'Dra. Soto',
    medication: 'Suero oral',
    date: '24/04/2026',
    operative: 'Chequeo familiar',
    operativeId: '1',
    status: 'Abr',
    patientId: '3',
    tone: 'blue',
  },
]

export const reportCards: ReportOption[] = [
  {
    title: 'Operativos',
    description: 'Reporte general de los operativos realizados.',
    endpoints: [
      { format: 'pdf', method: 'GET', path: '/reports/operations/pdf' },
      { format: 'excel', method: 'GET', path: '/reports/operations/excel' },
    ],
  },
  {
    title: 'Pacientes por operativo',
    description: 'Personas atendidas dentro de un operativo específico.',
    endpoints: [
      {
        format: 'pdf',
        method: 'GET',
        parameters: [
          {
            label: 'Operativo',
            name: 'id',
            placeholder: 'Selecciona un operativo',
            source: 'outreaches',
          },
        ],
        path: '/reports/operations/patients/pdf',
      },
      {
        format: 'excel',
        method: 'GET',
        parameters: [
          {
            label: 'Operativo',
            name: 'id',
            placeholder: 'Selecciona un operativo',
            source: 'outreaches',
          },
        ],
        path: '/reports/operations/patients/excel',
      },
    ],
  },
  {
    title: 'Atenciones por paciente',
    description: 'Historial médico de un paciente dentro de un operativo.',
    endpoints: [
      {
        format: 'pdf',
        method: 'GET',
        parameters: [
          {
            label: 'Operativo',
            name: 'operationId',
            placeholder: 'Selecciona un operativo',
            source: 'outreaches',
          },
          {
            label: 'Paciente',
            name: 'patientId',
            placeholder: 'Selecciona un paciente',
            source: 'patients',
          },
        ],
        path: '/reports/operations/patients/attentions/pdf',
      },
      {
        format: 'excel',
        method: 'GET',
        parameters: [
          {
            label: 'Operativo',
            name: 'operationId',
            placeholder: 'Selecciona un operativo',
            source: 'outreaches',
          },
          {
            label: 'Paciente',
            name: 'patientId',
            placeholder: 'Selecciona un paciente',
            source: 'patients',
          },
        ],
        path: '/reports/operations/patients/attentions/excel',
      },
    ],
  },
]
