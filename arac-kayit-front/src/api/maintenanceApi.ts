import apiClient from './client'
import type { MaintenanceRecordRequest, MaintenanceRecordResponse } from '../types/maintenance'

export const getMaintenanceRecords = async (plaka: string) => {
  const response = await apiClient.get<MaintenanceRecordResponse[]>(`/api/maintenance/plaka/${plaka}`)
  return response.data
}

export const createMaintenanceRecord = async (vehicleId: number, payload: MaintenanceRecordRequest) => {
  const response = await apiClient.post<MaintenanceRecordResponse>(`/api/maintenance/vehicle/${vehicleId}`, payload)
  return response.data
}

export const deleteMaintenanceRecord = async (id: number) => {
  await apiClient.delete(`/api/maintenance/${id}`)
}
