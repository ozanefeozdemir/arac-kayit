import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Papa from 'papaparse'
import { formatDate, formatCurrency } from './dateFormat'
import type { VehicleResponse, VehicleRequest } from '../types/vehicle'
import type { MaintenanceRecordResponse } from '../types/maintenance'
import type { ContractInfoResponse } from '../types/contract'

// --- PDF EXPORT FONKSİYONLARI ---

export const exportVehiclesToPdf = (vehicles: VehicleResponse[]) => {
  const doc = new jsPDF('landscape')
  doc.text('Arac Listesi', 14, 15)
  
  const tableData = vehicles.map(v => [
    v.plaka, v.marka, v.model, v.modelYili.toString(), v.tipi, 
    v.km.toLocaleString('tr-TR'), formatDate(v.muayeneTarihi), v.durum
  ])

  autoTable(doc, {
    head: [['Plaka', 'Marka', 'Model', 'Yil', 'Tipi', 'KM', 'Muayene', 'Durum']],
    body: tableData,
    startY: 20,
  })
  
  doc.save('arac-listesi.pdf')
}

export const exportMaintenanceToPdf = (records: MaintenanceRecordResponse[], plaka: string) => {
  const doc = new jsPDF()
  doc.text(`${plaka} - Bakim Gecmisi`, 14, 15)

  const tableData = records.map(r => [
    formatDate(r.bakimTarihi), 
    r.yapilanIslemler, 
    r.maliyet ? formatCurrency(r.maliyet) : '-'
  ])

  autoTable(doc, {
    head: [['Tarih', 'Islemler', 'Maliyet']],
    body: tableData,
    startY: 20,
  })

  doc.save(`${plaka}-bakim-gecmisi.pdf`)
}

export const exportContractsToPdf = (records: ContractInfoResponse[], plaka: string) => {
  const doc = new jsPDF('landscape')
  doc.text(`${plaka} - Sozlesme Gecmisi`, 14, 15)

  const tableData = records.map(r => [
    formatDate(r.sozlesmeTarihi), r.aracKiralayan, formatDate(r.kiralamaTarihi), 
    r.kiraSuresiGun.toString(), formatCurrency(r.kiraBedeliGunlukKdvHaric), formatCurrency(r.odenecekToplamTutar)
  ])

  autoTable(doc, {
    head: [['Sozlesme Tarihi', 'Kiralayan', 'Kiralama Tarihi', 'Sure(Gun)', 'Gunluk Bedel', 'Toplam']],
    body: tableData,
    startY: 20,
  })

  doc.save(`${plaka}-sozlesme-gecmisi.pdf`)
}

// --- CSV EXPORT FONKSİYONLARI ---

export const downloadCSV = (csvContent: string, fileName: string) => {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }) // \uFEFF for Excel UTF-8 BOM
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  window.URL.revokeObjectURL(url)
}

export const exportVehiclesToCsv = (vehicles: VehicleResponse[]) => {
  const csv = Papa.unparse(vehicles.map(v => ({
    Plaka: v.plaka, Marka: v.marka, Model: v.model, Yil: v.modelYili,
    Tipi: v.tipi, KM: v.km, MuayeneTarihi: formatDate(v.muayeneTarihi), Durum: v.durum
  })))
  downloadCSV(csv, 'arac-listesi.csv')
}

// --- CSV ŞABLON VE IMPORT FONKSİYONLARI ---

export const downloadVehicleImportTemplate = () => {
  const templateHeaders = [
    'plaka', 'marka', 'model', 'modelYili', 'tipi', 'km', 
    'muayeneTarihi(YYYY-MM-DD)', 'tescilTarihi(YYYY-MM-DD)', 'durum(AKTIF/PASIF/SATILDI)'
  ]
  const exampleRow = ['34ABC123', 'Renault', 'Megane', '2023', '1.3 TCe', '15000', '2025-10-10', '2023-01-01', 'AKTIF']
  const csv = Papa.unparse([templateHeaders, exampleRow])
  downloadCSV(csv, 'arac-ice-aktarma-sablonu.csv')
}

export const parseVehicleBulkCsv = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error)
    })
  })
}