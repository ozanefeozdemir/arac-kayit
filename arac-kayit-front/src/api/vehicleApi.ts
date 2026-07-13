import apiClient from './client'
import type { VehicleRequest, VehicleResponse } from '../types/vehicle'

export interface PageResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  size: number
  number: number
}

export const getVehicles = async (params?: {
  plaka?: string
  modelYili?: number
  durum?: string
  page?: number
  size?: number
}) => {
  const response = await apiClient.get<PageResponse<VehicleResponse>>('/api/vehicle', { params })
  return response.data
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
