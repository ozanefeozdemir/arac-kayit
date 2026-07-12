import { describe, expect, it } from 'vitest'
import { buildVehicleCsv, parseVehicleCsv } from '../types/vehicleCsv.ts'

describe('parseVehicleCsv', () => {
  it('parses a CSV row into vehicle form data', () => {
    const csv = [
      'plaka,marka,model,modelYili,tipi,km,muayeneTarihi,tescilTarihi,lastikBilgisi,ekspertiz,durum',
      '34ABC123,Toyota,Corolla,2022,Sedan,12000,2026-08-15,2026-09-10,Yaz,lastik,AKTIF',
    ].join('\n')

    expect(parseVehicleCsv(csv)).toMatchObject({
      plaka: '34ABC123',
      marka: 'Toyota',
      model: 'Corolla',
      modelYili: 2022,
      tipi: 'Sedan',
      km: 12000,
      muayeneTarihi: '2026-08-15',
      tescilTarihi: '2026-09-10',
      lastikBilgisi: 'Yaz',
      ekspertiz: 'lastik',
      durum: 'AKTIF',
    })
  })
})

describe('buildVehicleCsv', () => {
  it('creates CSV content from form data', () => {
    const csv = buildVehicleCsv({
      plaka: '34ABC123',
      marka: 'Toyota',
      model: 'Corolla',
      modelYili: 2022,
      tipi: 'Sedan',
      km: 12000,
      muayeneTarihi: '2026-08-15',
      tescilTarihi: '2026-09-10',
      lastikBilgisi: 'Yaz',
      ekspertiz: 'lastik',
      durum: 'AKTIF',
    })

    expect(csv).toContain('plaka,marka,model')
    expect(csv).toContain('34ABC123,Toyota,Corolla')
  })
})
