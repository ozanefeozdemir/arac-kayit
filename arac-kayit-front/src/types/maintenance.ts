export interface MaintenanceRecordRequest {
  bakimTarihi: string
  yapilanIslemler: string
  maliyet: number | null
}

export interface MaintenanceRecordResponse {
  id: number
  bakimTarihi: string
  yapilanIslemler: string
  maliyet: number | null
}
