import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('medicalOutreach', {
  downloadReport: (url: string, suggestedFileName: string) =>
    ipcRenderer.invoke('reports:download', url, suggestedFileName),
})
