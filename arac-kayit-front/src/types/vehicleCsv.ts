import type { VehicleRequest } from './vehicle'

const csvHeaders = [
  'plaka',
  'marka',
  'model',
  'modelYili',
  'tipi',
  'km',
  'muayeneTarihi',
  'tescilTarihi',
  'lastikBilgisi',
  'ekspertiz',
  'durum',
] as const

export const buildVehicleCsv = (vehicle: Partial<VehicleRequest> | Record<string, string | number | null | undefined>) => {
  const values = csvHeaders.map((header) => {
    const value = vehicle[header]
    if (value === null || value === undefined) return ''
    return String(value).replace(/\r?\n/g, ' ').replace(/"/g, '""')
  })

  return [csvHeaders.join(','), values.join(',')].join('\n')
}

export const parseVehicleCsv = (csvContent: string): Partial<VehicleRequest> => {
  const [headerLine, ...rows] = csvContent.split(/\r?\n/).filter(Boolean)
  const headers = headerLine.split(',').map((column) => column.trim())
  const values = rows[0]?.split(',') ?? []

  const parsed = headers.reduce<Record<string, string | number | null>>((accumulator, header, index) => {
    const rawValue = values[index] ?? ''
    accumulator[header] = rawValue.trim()
    return accumulator
  }, {})

  return {
    plaka: String(parsed.plaka ?? ''),
    marka: String(parsed.marka ?? ''),
    model: String(parsed.model ?? ''),
    modelYili: Number(parsed.modelYili ?? 0) || 0,
    tipi: String(parsed.tipi ?? ''),
    km: Number(parsed.km ?? 0) || 0,
    muayeneTarihi: String(parsed.muayeneTarihi ?? ''),
    tescilTarihi: String(parsed.tescilTarihi ?? ''),
    lastikBilgisi: String(parsed.lastikBilgisi ?? '') || null,
    ekspertiz: String(parsed.ekspertiz ?? '') || null,
    durum: String(parsed.durum ?? 'AKTIF') as VehicleRequest['durum'],
  }
}
