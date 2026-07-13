import apiClient from './client'
import type { VehicleRequest, VehicleResponse } from '../types/vehicle'

export const getVehicles = async (params?: {
  plaka?: string
  modelYili?: number
  durum?: string
}) => {
  const response = await apiClient.get<VehicleResponse[]>('/api/vehicle', { params })
  return response.data.reverse()
}

export const getVehicleById = async (id: number) => {
  const response = await apiClient.get<VehicleResponse>(`/api/vehicle/${id}`)
  return response.data
}

export const createVehicle = async (payload: VehicleRequest) => {
  const response = await apiClient.post<VehicleResponse>('/api/vehicle', payload)
  return response.data
}

export const updateVehicle = async (id: number, payload: VehicleRequest) => {
  const response = await apiClient.put<VehicleResponse>(`/api/vehicle/${id}`, payload)
  return response.data
}

export const deleteVehicle = async (id: number) => {
  await apiClient.delete(`/api/vehicle/${id}`)
}
