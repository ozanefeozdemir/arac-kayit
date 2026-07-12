export interface ContractInfoRequest {
  sozlesmeTarihi: string
  aracKiralayan: string
  vergiDairesi: string | null
  vergiNo: string | null
  adres: string | null
  yetkiliAdSoyad: string
  unvan: string | null
  tckn: string | null
  telefon: string | null
  kullanici: string | null
  kiralamaTarihi: string
  baslangicKm: number | null
  donusKm: number | null
  kiraSuresiGun: number
  kiraBedeliGunlukKdvHaric: number
  lastik: string | null
}

export interface ContractInfoResponse extends ContractInfoRequest {
  id: number
  donusTarihi: string
  odenecekToplamTutar: number
  vehicleId: number
}
