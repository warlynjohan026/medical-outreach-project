import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { buildApiUrl } from '../services/apiClient'
import type { ReportOption } from '../types'
import { Button } from './Button'

type ReportParameterOption = {
  label: string
  value: string
}

type ReportCardProps = ReportOption & {
  parameterOptions: {
    outreaches: ReportParameterOption[]
    patients: ReportParameterOption[]
  }
}

export function ReportCard({ description, endpoints, parameterOptions, title }: ReportCardProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<
    ReportOption['endpoints'][number] | null
  >(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [notification, setNotification] = useState<{
    message: string
    tone: 'success' | 'error'
  } | null>(null)
  const [parameterValues, setParameterValues] = useState<Record<string, string>>({})

  const missingRequiredParameter = useMemo(() => {
    if (!selectedEndpoint?.parameters) {
      return false
    }

    return selectedEndpoint.parameters.some((parameter) => !parameterValues[parameter.name]?.trim())
  }, [parameterValues, selectedEndpoint])

  useEffect(() => {
    if (!notification) {
      return
    }

    const timeoutId = window.setTimeout(() => setNotification(null), 50000)

    return () => window.clearTimeout(timeoutId)
  }, [notification])

  async function handleSelectEndpoint(endpoint: ReportOption['endpoints'][number]) {
    if (!endpoint.parameters?.length) {
      await generateReport(endpoint)
      return
    }

    setSelectedEndpoint(endpoint)
    setParameterValues(
      endpoint.parameters.reduce<Record<string, string>>((values, parameter) => {
        values[parameter.name] = ''
        return values
      }, {}),
    )
  }

  function closeParameterModal() {
    setSelectedEndpoint(null)
    setParameterValues({})
  }

  async function generateReport(
    endpoint: ReportOption['endpoints'][number],
    params?: Record<string, string>,
  ) {
    setIsGenerating(true)
    setNotification(null)

    try {
      const url = buildApiUrl(endpoint.path, params)
      const suggestedFileName = getSuggestedReportFileName(endpoint, params)

      if (!window.medicalOutreach) {
        downloadWithBrowser(url)
        setNotification({
          message: 'Se envió la descarga del reporte.',
          tone: 'success',
        })
        return
      }

      const result = await window.medicalOutreach.downloadReport(url, suggestedFileName)

      if (result.canceled) {
        return
      }

      setNotification({
        message: result.message,
        tone: result.ok ? 'success' : 'error',
      })
    } catch (error) {
      setNotification({
        message: getErrorMessage(error),
        tone: 'error',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  async function submitParameters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedEndpoint || missingRequiredParameter) {
      return
    }

    await generateReport(selectedEndpoint, parameterValues)
    closeParameterModal()
  }

  return (
    <>
      <article className="motion-row grid min-h-[210px] content-start gap-3.5 rounded-[20px] border border-[var(--line)] bg-white p-[18px]">
        <strong className="text-[15px] text-[var(--ink)]">{title}</strong>
        <p className="m-0 text-[13px] leading-normal text-[var(--muted)]">{description}</p>
        <div className="flex flex-wrap gap-2">
          {endpoints.map((endpoint) => (
            <Button
              disabled={isGenerating}
              key={endpoint.format}
              onClick={() => handleSelectEndpoint(endpoint)}
              variant="secondary"
            >
              {formatReportName(endpoint.format)}
            </Button>
          ))}
        </div>
      </article>

      {selectedEndpoint ? (
        <div
          aria-modal="true"
          className="modal-scrim fixed inset-0 z-50 grid place-items-center bg-[rgba(24,33,32,0.38)] px-4 py-6"
          role="dialog"
        >
          <form
            className="modal-panel w-full max-w-[420px] min-w-0 overflow-hidden rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_22px_64px_rgba(28,28,34,0.18)]"
            onSubmit={submitParameters}
          >
            <div className="grid min-w-0 gap-1">
              <strong className="text-base leading-tight text-[var(--ink)]">
                Parámetros del reporte
              </strong>
              <span className="truncate text-[13px] text-[var(--muted)]">
                {title} · {formatReportName(selectedEndpoint.format)}
              </span>
            </div>

            <div className="mt-5 grid min-w-0 gap-3">
              {selectedEndpoint.parameters?.map((parameter) => {
                const options = parameter.source ? parameterOptions[parameter.source] : []

                return (
                  <label className="grid min-w-0 gap-1.5" key={parameter.name}>
                    <span className="text-[13px] font-bold text-[var(--ink)]">
                      {parameter.label}
                    </span>
                    {options.length ? (
                      <select
                        className="box-border min-h-[42px] w-full min-w-0 rounded-xl border border-[var(--line-strong)] bg-white px-3 text-[14px] text-[var(--ink)] outline-none transition focus:border-[var(--primary)] focus:ring-3 focus:ring-[rgba(94,200,189,0.22)]"
                        onChange={(event) =>
                          setParameterValues((currentValues) => ({
                            ...currentValues,
                            [parameter.name]: event.target.value,
                          }))
                        }
                        value={parameterValues[parameter.name] ?? ''}
                      >
                        <option value="">{parameter.placeholder}</option>
                        {options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="box-border min-h-[42px] w-full min-w-0 rounded-xl border border-[var(--line-strong)] bg-white px-3 text-[14px] text-[var(--ink)] outline-none transition focus:border-[var(--primary)] focus:ring-3 focus:ring-[rgba(94,200,189,0.22)]"
                        onChange={(event) =>
                          setParameterValues((currentValues) => ({
                            ...currentValues,
                            [parameter.name]: event.target.value,
                          }))
                        }
                        placeholder={parameter.placeholder}
                        value={parameterValues[parameter.name] ?? ''}
                      />
                    )}
                  </label>
                )
              })}
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button onClick={closeParameterModal} type="button" variant="secondary">
                Cancelar
              </Button>
              <Button disabled={missingRequiredParameter || isGenerating} type="submit">
                {isGenerating ? 'Generando...' : 'Generar'}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {notification ? (
        <aside
          className={`fixed right-5 top-5 z-[60] w-[min(360px,calc(100vw-40px))] animate-[report-toast-in_220ms_ease-out] rounded-2xl border bg-white p-4 shadow-[0_18px_48px_rgba(28,28,34,0.16)] ${
            notification.tone === 'success'
              ? 'border-[rgba(44,122,123,0.24)]'
              : 'border-[rgba(233,143,134,0.34)]'
          }`}
          role="status"
        >
          <strong
            className={`block text-[14px] ${
              notification.tone === 'success' ? 'text-[var(--primary-dark)]' : 'text-[#a33f35]'
            }`}
          >
            {notification.tone === 'success' ? 'Reporte listo' : 'No se generó el reporte'}
          </strong>
          <span className="mt-1 block text-[13px] leading-normal text-[var(--muted)]">
            {notification.message}
          </span>
        </aside>
      ) : null}
    </>
  )
}

function formatReportName(format: ReportOption['endpoints'][number]['format']) {
  return format === 'pdf' ? 'PDF' : 'Excel'
}

function getSuggestedReportFileName(
  endpoint: ReportOption['endpoints'][number],
  params?: Record<string, string>,
) {
  const extension = endpoint.format === 'pdf' ? 'pdf' : 'xlsx'

  if (endpoint.path.includes('/patients/attentions')) {
    return `operation-${params?.operationId ?? 'selected'}-patient-${
      params?.patientId ?? 'selected'
    }-attentions-report.${extension}`
  }

  if (endpoint.path.includes('/operations/patients')) {
    return `operation-${params?.id ?? 'selected'}-patients-report.${extension}`
  }

  return `operations-report.${extension}`
}

function downloadWithBrowser(url: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = ''
  link.rel = 'noopener noreferrer'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Ocurrió un error inesperado generando el reporte.'
}
