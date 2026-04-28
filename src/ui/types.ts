export type Screen = 'Inicio' | 'Operativos' | 'Pacientes' | 'Atenciones' | 'Reportes'

export type BadgeTone = 'sun' | 'soft' | 'rose' | 'blue' | 'primary'

export type MetricTone = 'primary' | 'accent' | 'warning' | 'coral'

export type Metric = {
  label: string
  tone: MetricTone
  value: string
}

export type Outreach = {
  date: string
  id?: string
  initials: string
  location: string
  name: string
  status: string
  statusValue: '0' | '1'
  tone: BadgeTone
}

export type CreateOutreachPayload = {
  location: string
  name: string
  operativeDate: string
  status: '0' | '1'
}

export type SearchOutreachParams = {
  location?: string
  name?: string
  operativeDate?: string
  status?: '' | '0' | '1'
}

export type UpdateOutreachPayload = Partial<CreateOutreachPayload>

export type Patient = {
  address: string
  allergies: string
  birthDate: string
  bloodType: string
  condition: string
  document: string
  firstName: string
  id?: string
  initials: string
  lastName: string
  name: string
  phone: string
  tone: BadgeTone
}

export type CreatePatientPayload = {
  address: string
  allergies: boolean
  birthDate: string
  bloodType: string
  firstName: string
  lastName: string
  medicalConditions: string
  phoneNumber: string
  taxId: string
}

export type SearchPatientParams = {
  firstName?: string
  id?: string
  lastName?: string
  taxId?: string
}

export type UpdatePatientPayload = Partial<CreatePatientPayload>

export type Attention = {
  date: string
  day: string
  doctor: string
  id?: string
  medication: string
  operative: string
  patient: string
  patientId: string
  operativeId: string
  status: string
  tone: BadgeTone
}

export type CreateAttentionPayload = {
  attentionDate: string
  doctor: string
  medication: string
  operativeId: string
  patientId: string
}

export type SearchAttentionParams = {
  attentionDate?: string
  doctor?: string
  operativeName?: string
  patientName?: string
}

export type UpdateAttentionPayload = Partial<CreateAttentionPayload>

export type ReportFormat = 'pdf' | 'excel'

export type ReportParameter = {
  label: string
  name: string
  placeholder: string
  source?: 'outreaches' | 'patients'
}

export type ReportEndpoint = {
  format: ReportFormat
  method: 'GET'
  parameters?: ReportParameter[]
  path: string
}

export type ReportOption = {
  description: string
  endpoints: ReportEndpoint[]
  title: string
}
