type ReportDownloadResult = {
  canceled?: boolean
  message: string
  ok: boolean
}

interface Window {
  medicalOutreach?: {
    downloadReport: (url: string, suggestedFileName: string) => Promise<ReportDownloadResult>
  }
}
