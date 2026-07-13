export type VehicleStatusValue = 'AKTIF' | 'PASIF' | 'SERVISTE' | 'SATILDI' | 'HURDA'

export interface VehicleRequest {
  plaka: string
  marka: string
  model: string
  modelYili: number
  tipi: string
  km: number
  muayeneTarihi: string
  tescilTarihi: string
  lastikBilgisi: string | null
  ekspertiz: string | null
  durum: VehicleStatusValue
  tescilBelgeNo: string | null
  pasifNedeni: string | null
  satisTarihi: string | null
}

export interface VehicleResponse {
  id: number
  plaka: string
  marka: string
  model: string
  modelYili: number
  tipi: string
  km: number
  muayeneTarihi: string
  tescilTarihi: string
  lastikBilgisi: string | null
  ekspertiz: string | null
  durum: VehicleStatusValue | string
  createdAt: string
  updatedAt: string
  tescilBelgeNo: string | null
  pasifNedeni: string | null
  satisTarihi: string | null
}
