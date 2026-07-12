import apiClient from './client'
import type { ContractInfoRequest, ContractInfoResponse } from '../types/contract'

export const getContractRecords = async (plaka: string) => {
  const response = await apiClient.get<ContractInfoResponse[]>(`/api/contract/plaka/${plaka}`)
  return response.data
}

export const createContractRecord = async (vehicleId: number, payload: ContractInfoRequest) => {
  const response = await apiClient.post<ContractInfoResponse>(`/api/contract/vehicle/${vehicleId}`, payload)
  return response.data
}

export const deleteContractRecord = async (id: number) => {
  await apiClient.delete(`/api/contract/${id}`)
}
