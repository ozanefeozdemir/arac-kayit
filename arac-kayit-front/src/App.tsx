import { useEffect, useMemo, useState, type FormEvent } from 'react'
import './App.css'
import { createVehicle, deleteVehicle, getVehicles, updateVehicle } from './api/vehicleApi'
import { createMaintenanceRecord, deleteMaintenanceRecord, getMaintenanceRecords } from './api/maintenanceApi'
import { createContractRecord, deleteContractRecord, getContractRecords } from './api/contractApi'
import type { VehicleRequest, VehicleResponse } from './types/vehicle'
import type { MaintenanceRecordResponse } from './types/maintenance'
import type { ContractInfoResponse } from './types/contract'
import { formatCurrency, formatDate, getTodayString, normalizePlaka } from './utils/dateFormat'
import { buildVehicleCsv, parseVehicleCsv } from './types/vehicleCsv'
import Bildirim from './components/Bildirim'

const emptyVehicleForm: VehicleRequest = {
  plaka: '',
  marka: '',
  model: '',
  modelYili: new Date().getFullYear(),
  tipi: '',
  km: 0,
  muayeneTarihi: getTodayString(),
  tescilTarihi: getTodayString(),
  lastikBilgisi: '',
  ekspertiz: '',
  durum: 'AKTIF',
  tescilBelgeNo: '',
  pasifNedeni: '',
  satisTarihi: getTodayString(),
}

const statusOptions = [
  { value: 'AKTIF', label: 'Aktif' },
  { value: 'PASIF', label: 'Pasif' },
  { value: 'SERVISTE', label: 'Serviste' },
  { value: 'SATILDI', label: 'Satıldı' },
  { value: 'HURDA', label: 'Hurda' },
]

function App() {
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleResponse | null>(null)
  const [vehicleForm, setVehicleForm] = useState<VehicleRequest>(emptyVehicleForm)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'vehicle' | 'maintenance' | 'contract'>('vehicle')
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  const [savingVehicle, setSavingVehicle] = useState(false)
  const [deletingVehicle, setDeletingVehicle] = useState(false)
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecordResponse[]>([])
  const [contractRecords, setContractRecords] = useState<ContractInfoResponse[]>([])
  const [loadingMaintenance, setLoadingMaintenance] = useState(false)
  const [loadingContracts, setLoadingContracts] = useState(false)
  const [savingMaintenance, setSavingMaintenance] = useState(false)
  const [savingContract, setSavingContract] = useState(false)
  const [filters, setFilters] = useState({ plaka: '', modelYili: '', durum: '' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [banner, setBanner] = useState<{ type: 'error' | 'success'; title: string; message?: string } | null>(null)
  const [isVehicleFormVisible, setIsVehicleFormVisible] = useState(false)
  const [maintenanceForm, setMaintenanceForm] = useState({ bakimTarihi: getTodayString(), yapilanIslemler: '', maliyet: '' })
  const [contractForm, setContractForm] = useState({
    sozlesmeTarihi: getTodayString(),
    aracKiralayan: '',
    vergiDairesi: '',
    vergiNo: '',
    adres: '',
    yetkiliAdSoyad: '',
    unvan: '',
    tckn: '',
    telefon: '',
    kullanici: '',
    kiralamaTarihi: getTodayString(),
    baslangicKm: '',
    donusKm: '',
    kiraSuresiGun: '',
    kiraBedeliGunlukKdvHaric: '',
    lastik: '',
  })

  useEffect(() => {
    void loadVehicles()
  }, [])

  useEffect(() => {
    if (selectedVehicle) {
      void loadRelatedRecords(selectedVehicle.plaka)
      setActiveTab('vehicle')
    }
  }, [selectedVehicle])

  useEffect(() => {
    if (banner) {
      const timer = window.setTimeout(() => setBanner(null), 4500)
      return () => window.clearTimeout(timer)
    }
  }, [banner])

  const loadVehicles = async () => {
    setLoadingVehicles(true)
    try {
      const data = await getVehicles({
        plaka: filters.plaka || undefined,
        modelYili: filters.modelYili ? Number(filters.modelYili) : undefined,
        durum: filters.durum || undefined,
      })
      setVehicles(data)
    } catch {
      setBanner({
        type: 'error',
        title: 'Sunucuya bağlanılamıyor.',
        message: 'Lütfen internet bağlantınızı kontrol edin.',
      })
    } finally {
      setLoadingVehicles(false)
    }
  }

  const loadRelatedRecords = async (plaka: string) => {
    try {
      setLoadingMaintenance(true)
      setLoadingContracts(true)
      const [maintenance, contracts] = await Promise.all([getMaintenanceRecords(plaka), getContractRecords(plaka)])
      setMaintenanceRecords(maintenance)
      setContractRecords(contracts)
    } catch (error: any) {
      setBanner({ type: 'error', title: 'Kayıtlar yüklenirken hata oluştu.', message: error?.response?.data?.detail ?? 'Lütfen daha sonra tekrar deneyin.' })
    } finally {
      setLoadingMaintenance(false)
      setLoadingContracts(false)
    }
  }

  const clearVehicleForm = () => {
    setVehicleForm(emptyVehicleForm)
    setSelectedVehicle(null)
    setIsEditing(false)
    setActiveTab('vehicle')
    setFormErrors({})
    setIsVehicleFormVisible(true)
    window.setTimeout(() => {
      document.getElementById('vehicle-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  const handleVehicleFormOpen = () => {
    setIsVehicleFormVisible(true)
    window.setTimeout(() => {
      document.getElementById('vehicle-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  const handleCsvImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const csvText = reader.result as string
      const parsedVehicle = parseVehicleCsv(csvText)
      setVehicleForm({
        ...emptyVehicleForm,
        ...parsedVehicle,
        modelYili: parsedVehicle.modelYili ?? emptyVehicleForm.modelYili,
        km: parsedVehicle.km ?? emptyVehicleForm.km,
      })
      setSelectedVehicle(null)
      setIsEditing(false)
      setFormErrors({})
      setIsVehicleFormVisible(true)
      window.setTimeout(() => {
        document.getElementById('vehicle-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 0)
      setBanner({ type: 'success', title: 'CSV içeriği yüklendi. Formu inceleyip kaydedebilirsiniz.' })
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const handleCsvExport = () => {
    const csvContent = buildVehicleCsv(vehicleForm)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `arac-${vehicleForm.plaka || 'yeni'}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const validateVehicle = (payload: VehicleRequest) => {
    const nextErrors: Record<string, string> = {}
    if (!payload.plaka.trim()) nextErrors.plaka = 'Plaka alanı boş bırakılamaz.'
    if (!payload.marka.trim()) nextErrors.marka = 'Marka alanı zorunludur.'
    if (!payload.model.trim()) nextErrors.model = 'Model alanı zorunludur.'
    if (!payload.modelYili || payload.modelYili < 1900 || payload.modelYili > new Date().getFullYear()) nextErrors.modelYili = 'Model yılı 1900 ile bu yıl arasında olmalıdır.'
    if (!payload.tipi.trim()) nextErrors.tipi = 'Tipi alanı zorunludur.'
    if (payload.km < 0 || payload.km > 999999) nextErrors.km = 'KM 0 ile 999.999 arasında olmalıdır.'
    if (!payload.muayeneTarihi) nextErrors.muayeneTarihi = 'Muayene tarihi zorunludur.'
    if (!payload.tescilTarihi) nextErrors.tescilTarihi = 'Tescil tarihi zorunludur.'
    if (payload.muayeneTarihi && payload.muayeneTarihi > getTodayString()) nextErrors.muayeneTarihi = 'Muayene tarihi bugünden ileri olamaz.'
    if (payload.tescilTarihi && payload.tescilTarihi > getTodayString()) nextErrors.tescilTarihi = 'Tescil tarihi bugünden ileri olamaz.'
    if (!payload.durum) nextErrors.durum = 'Durum seçilmelidir.'
    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleVehicleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const payload: VehicleRequest = {
      ...vehicleForm,
      plaka: normalizePlaka(vehicleForm.plaka),
      lastikBilgisi: vehicleForm.lastikBilgisi?.trim() || null,
      ekspertiz: vehicleForm.ekspertiz?.trim() || null,
    }

    if (!validateVehicle(payload)) return

    setSavingVehicle(true)
    try {
      const result = isEditing && selectedVehicle ? await updateVehicle(selectedVehicle.id, payload) : await createVehicle(payload)
      setSelectedVehicle(result)
      setVehicleForm({
        ...result,
        lastikBilgisi: result.lastikBilgisi ?? '',
        ekspertiz: result.ekspertiz ?? '',
        durum: result.durum as VehicleRequest['durum'],
      })
      setIsEditing(true)
      setFormErrors({})
      setBanner({ type: 'success', title: isEditing ? 'Kayıt güncellendi.' : 'Kayıt başarıyla oluşturuldu.' })
      await loadVehicles()
    } catch (error: any) {
      const serverErrors = error?.response?.data?.errors
      if (serverErrors && typeof serverErrors === 'object') {
        setFormErrors(serverErrors as Record<string, string>)
      } else {
        const detail = error?.response?.data?.detail
        const title = error?.response?.data?.title
        if (title === 'Plaka Çakışması' && detail) {
          setFormErrors({ plaka: detail })
        } else {
          setBanner({ type: 'error', title: title ?? 'İşlem başarısız oldu.', message: detail ?? 'Lütfen tekrar deneyin.' })
        }
      }
    } finally {
      setSavingVehicle(false)
    }
  }

  const handleVehicleDelete = async () => {
    if (!selectedVehicle || !window.confirm('Bu kaydı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return
    setDeletingVehicle(true)
    try {
      await deleteVehicle(selectedVehicle.id)
      setBanner({ type: 'success', title: 'Araç kaydı silindi.' })
      setSelectedVehicle(null)
      setVehicleForm(emptyVehicleForm)
      setIsEditing(false)
      await loadVehicles()
    } catch (error: any) {
      setBanner({ type: 'error', title: error?.response?.data?.title ?? 'Silme işlemi başarısız oldu.', message: error?.response?.data?.detail ?? 'Lütfen tekrar deneyin.' })
    } finally {
      setDeletingVehicle(false)
    }
  }

  const onRowSelect = (vehicle: VehicleResponse) => {
    setSelectedVehicle(vehicle)
    setIsVehicleFormVisible(true)
    setVehicleForm({
      plaka: vehicle.plaka,
      marka: vehicle.marka,
      model: vehicle.model,
      modelYili: vehicle.modelYili,
      tipi: vehicle.tipi,
      km: vehicle.km,
      muayeneTarihi: vehicle.muayeneTarihi,
      tescilTarihi: vehicle.tescilTarihi,
      lastikBilgisi: vehicle.lastikBilgisi ?? '',
      ekspertiz: vehicle.ekspertiz ?? '',
      durum: vehicle.durum as VehicleRequest['durum'],
      tescilBelgeNo: vehicle.tescilBelgeNo ?? '',
      pasifNedeni: vehicle.pasifNedeni ?? '',
      satisTarihi: vehicle.satisTarihi ?? '',
    })
    setIsEditing(true)
    setFormErrors({})
  }

  const handleMaintenanceSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedVehicle) return
    setSavingMaintenance(true)
    try {
      await createMaintenanceRecord(selectedVehicle.id, {
        bakimTarihi: maintenanceForm.bakimTarihi,
        yapilanIslemler: maintenanceForm.yapilanIslemler,
        maliyet: maintenanceForm.maliyet ? Number(maintenanceForm.maliyet) : null,
      })
      setMaintenanceForm({ bakimTarihi: getTodayString(), yapilanIslemler: '', maliyet: '' })
      await loadRelatedRecords(selectedVehicle.plaka)
      setBanner({ type: 'success', title: 'Bakım kaydı oluşturuldu.' })
    } catch (error: any) {
      setBanner({ type: 'error', title: error?.response?.data?.title ?? 'Bakım kaydı oluşturulamadı.', message: error?.response?.data?.detail ?? 'Lütfen tekrar deneyin.' })
    } finally {
      setSavingMaintenance(false)
    }
  }

  const handleMaintenanceDelete = async (id: number) => {
    if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return
    try {
      await deleteMaintenanceRecord(id)
      if (selectedVehicle) await loadRelatedRecords(selectedVehicle.plaka)
      setBanner({ type: 'success', title: 'Bakım kaydı silindi.' })
    } catch (error: any) {
      setBanner({ type: 'error', title: 'Silme işlemi başarısız oldu.', message: error?.response?.data?.detail ?? 'Lütfen tekrar deneyin.' })
    }
  }

  const handleContractSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedVehicle) return
    if (contractForm.donusKm && contractForm.baslangicKm && Number(contractForm.donusKm) < Number(contractForm.baslangicKm)) {
      setBanner({ type: 'error', title: 'Dönüş km, başlangıç km\'den küçük olamaz.' })
      return
    }
    setSavingContract(true)
    try {
      await createContractRecord(selectedVehicle.id, {
        sozlesmeTarihi: contractForm.sozlesmeTarihi,
        aracKiralayan: contractForm.aracKiralayan,
        vergiDairesi: contractForm.vergiDairesi || null,
        vergiNo: contractForm.vergiNo || null,
        adres: contractForm.adres || null,
        yetkiliAdSoyad: contractForm.yetkiliAdSoyad,
        unvan: contractForm.unvan || null,
        tckn: contractForm.tckn || null,
        telefon: contractForm.telefon || null,
        kullanici: contractForm.kullanici || null,
        kiralamaTarihi: contractForm.kiralamaTarihi,
        baslangicKm: contractForm.baslangicKm ? Number(contractForm.baslangicKm) : null,
        donusKm: contractForm.donusKm ? Number(contractForm.donusKm) : null,
        kiraSuresiGun: Number(contractForm.kiraSuresiGun),
        kiraBedeliGunlukKdvHaric: Number(contractForm.kiraBedeliGunlukKdvHaric),
        lastik: contractForm.lastik || null,
      })
      setContractForm({
        sozlesmeTarihi: getTodayString(),
        aracKiralayan: '',
        vergiDairesi: '',
        vergiNo: '',
        adres: '',
        yetkiliAdSoyad: '',
        unvan: '',
        tckn: '',
        telefon: '',
        kullanici: '',
        kiralamaTarihi: getTodayString(),
        baslangicKm: '',
        donusKm: '',
        kiraSuresiGun: '',
        kiraBedeliGunlukKdvHaric: '',
        lastik: '',
      })
      await loadRelatedRecords(selectedVehicle.plaka)
      setBanner({ type: 'success', title: 'Sözleşme kaydı oluşturuldu.' })
    } catch (error: any) {
      setBanner({ type: 'error', title: error?.response?.data?.title ?? 'Sözleşme kaydı oluşturulamadı.', message: error?.response?.data?.detail ?? 'Lütfen tekrar deneyin.' })
    } finally {
      setSavingContract(false)
    }
  }

  const handleContractDelete = async (id: number) => {
    if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return
    try {
      await deleteContractRecord(id)
      if (selectedVehicle) await loadRelatedRecords(selectedVehicle.plaka)
      setBanner({ type: 'success', title: 'Sözleşme kaydı silindi.' })
    } catch (error: any) {
      setBanner({ type: 'error', title: 'Silme işlemi başarısız oldu.', message: error?.response?.data?.detail ?? 'Lütfen tekrar deneyin.' })
    }
  }

  const summaryText = useMemo(() => `${vehicles.length} araç bulundu`, [vehicles.length])

  return (
    <div className="app-shell">
      {banner ? <Bildirim type={banner.type} title={banner.title} message={banner.message} /> : null}
      <section className="panel">
        <div className="panel-header app-header">
          <div className="app-title-group">
            <img src="/Logo.jpeg" alt="Araç kayıt logosu" className="app-logo" />
            <div>
              <h1>Nikelaj Oto</h1>
              <p>Filtreleyin, listeleyin ve araç detaylarını yönetin.</p>
            </div>
          </div>
        </div>
        <div className="filters-row">
          <label>
            <span>Plaka</span>
            <input value={filters.plaka} onChange={(event) => setFilters({ ...filters, plaka: event.target.value })} placeholder="Plaka giriniz" />
          </label>
          <label>
            <span>Model Yılı</span>
            <input type="number" value={filters.modelYili} onChange={(event) => setFilters({ ...filters, modelYili: event.target.value })} placeholder="Örn: 2024" />
          </label>
          <label>
            <span>Araç Durumu</span>
            <select value={filters.durum} onChange={(event) => setFilters({ ...filters, durum: event.target.value })}>
              <option value="">Seçiniz</option>
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => void loadVehicles()} disabled={loadingVehicles}>{loadingVehicles ? 'Yükleniyor...' : 'Listele'}</button>
          <button type="button" className="secondary" onClick={() => { setFilters({ plaka: '', modelYili: '', durum: '' }); void loadVehicles() }}>Temizle</button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header inline">
          <h2>Araç Listesi</h2>
          <div className="panel-actions">
            <span className="muted">{summaryText}</span>
            <button type="button" className="primary" onClick={clearVehicleForm}>+ Yeni Araç Girişi</button>
          </div>
        </div>
        {loadingVehicles ? <p>Yükleniyor...</p> : vehicles.length === 0 ? <p className="empty">Kayıt bulunamadı</p> : (
          <table>
            <thead>
              <tr>
                <th>Plaka</th>
                <th>Marka</th>
                <th>Model</th>
                <th>Tipi</th>
                <th>KM</th>
                <th>Muayene Tarihi</th>
                <th>Lastik</th>
                <th>Tescil Tarihi</th>
                <th>Durumu</th>
                <th>Tescil Belge No</th>
                <th>Pasif Nedeni</th>
                <th>Satış Tarihi</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className={selectedVehicle?.id === vehicle.id ? 'selected-row' : ''} onClick={() => onRowSelect(vehicle)}>
                  <td>{vehicle.plaka}</td>
                  <td>{vehicle.marka}</td>
                  <td>{vehicle.model}</td>
                  <td>{vehicle.tipi}</td>
                  <td>{vehicle.km.toLocaleString('tr-TR')}</td>
                  <td>{formatDate(vehicle.muayeneTarihi)}</td>
                  <td>{vehicle.lastikBilgisi ?? '-'}</td>
                  <td>{formatDate(vehicle.tescilTarihi)}</td>
                  <td>{vehicle.durum}</td>
                  <td>{vehicle.tescilBelgeNo ?? '-'}</td>
                  <td>{vehicle.pasifNedeni ?? '-'}</td>
                  <td>{vehicle.satisTarihi ? formatDate(vehicle.satisTarihi) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel" id="vehicle-form-section">
        <div className="panel-header inline">
          <div>
            <h2>Araç Kayıt Formu</h2>
            <p className="muted">CSV import/export ile toplu işlem yapın.</p>
          </div>
          <div className="panel-actions">
            <label className="file-upload">
              <span>CSV İçeri Aktar</span>
              <input disabled type="file" accept=".csv,text/csv" onChange={handleCsvImport} />
            </label>
            <button disabled type="button" className="secondary" onClick={handleCsvExport}>CSV Dışa Aktar</button>
            {!isVehicleFormVisible ? <button type="button" className="primary" onClick={handleVehicleFormOpen}>Formu Aç</button> : null}
          </div>
        </div>
        <div className="tabs">
          <button type="button" className={activeTab === 'vehicle' ? 'tab active' : 'tab'} onClick={() => setActiveTab('vehicle')}>Araç Bilgisi</button>
          <button type="button" className={activeTab === 'maintenance' ? 'tab active' : 'tab'} disabled={!selectedVehicle} onClick={() => setActiveTab('maintenance')} title={!selectedVehicle ? 'Önce bir araç seçin' : ''}>Bakım Bilgisi</button>
          <button type="button" className={activeTab === 'contract' ? 'tab active' : 'tab'} disabled={!selectedVehicle} onClick={() => setActiveTab('contract')} title={!selectedVehicle ? 'Önce bir araç seçin' : ''}>Sözleşme Bilgisi</button>
        </div>

        {activeTab === 'vehicle' && isVehicleFormVisible ? (
          <form onSubmit={handleVehicleSubmit} className="vehicle-form">
            {!selectedVehicle ? <p className="empty">Detayları görmek için listeden bir araç seçin veya yeni araç ekleyin.</p> : null}
            <div className="form-grid">
              <label>
                <span>Plaka <span className="required">*</span></span>
                <input value={vehicleForm.plaka} onChange={(event) => setVehicleForm({ ...vehicleForm, plaka: event.target.value.toUpperCase() })} maxLength={20} />
                {formErrors.plaka ? <small className="error-text">{formErrors.plaka}</small> : null}
              </label>
              <label>
                <span>Marka <span className="required">*</span></span>
                <input value={vehicleForm.marka} onChange={(event) => setVehicleForm({ ...vehicleForm, marka: event.target.value })} maxLength={50} />
                {formErrors.marka ? <small className="error-text">{formErrors.marka}</small> : null}
              </label>
              <label>
                <span>Model <span className="required">*</span></span>
                <input value={vehicleForm.model} onChange={(event) => setVehicleForm({ ...vehicleForm, model: event.target.value })} maxLength={50} />
                {formErrors.model ? <small className="error-text">{formErrors.model}</small> : null}
              </label>
              <label>
                <span>Model Yılı <span className="required">*</span></span>
                <input type="number" value={vehicleForm.modelYili} onChange={(event) => setVehicleForm({ ...vehicleForm, modelYili: Number(event.target.value) })} min="1900" max={new Date().getFullYear()} />
                {formErrors.modelYili ? <small className="error-text">{formErrors.modelYili}</small> : null}
              </label>
              <label>
                <span>Tipi <span className="required">*</span></span>
                <input value={vehicleForm.tipi} onChange={(event) => setVehicleForm({ ...vehicleForm, tipi: event.target.value })} maxLength={100} />
                {formErrors.tipi ? <small className="error-text">{formErrors.tipi}</small> : null}
              </label>
              <label>
                <span>KM</span>
                <input type="number" value={vehicleForm.km} onChange={(event) => setVehicleForm({ ...vehicleForm, km: Number(event.target.value) })} min="0" max="999999" />
                {formErrors.km ? <small className="error-text">{formErrors.km}</small> : null}
              </label>
              <label>
                <span>Muayene Tarihi <span className="required">*</span></span>
                <input type="date" max={getTodayString()} value={vehicleForm.muayeneTarihi} onChange={(event) => setVehicleForm({ ...vehicleForm, muayeneTarihi: event.target.value })} />
                {formErrors.muayeneTarihi ? <small className="error-text">{formErrors.muayeneTarihi}</small> : null}
              </label>
              <label>
                <span>Ekspertiz</span>
                <textarea value={vehicleForm.ekspertiz ?? ''} onChange={(event) => setVehicleForm({ ...vehicleForm, ekspertiz: event.target.value })} />
              </label>
              <label>
                <span>Lastik</span>
                <input value={vehicleForm.lastikBilgisi ?? ''} onChange={(event) => setVehicleForm({ ...vehicleForm, lastikBilgisi: event.target.value })} maxLength={50} />
              </label>
              <label>
                <span>Tescil Tarihi <span className="required">*</span></span>
                <input type="date" max={getTodayString()} value={vehicleForm.tescilTarihi} onChange={(event) => setVehicleForm({ ...vehicleForm, tescilTarihi: event.target.value })} />
                {formErrors.tescilTarihi ? <small className="error-text">{formErrors.tescilTarihi}</small> : null}
              </label>
              <label>
                <span>Durumu <span className="required">*</span></span>
                <select value={vehicleForm.durum} onChange={(event) => setVehicleForm({ ...vehicleForm, durum: event.target.value as VehicleRequest['durum'] })}>
                  {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                {formErrors.durum ? <small className="error-text">{formErrors.durum}</small> : null}
              </label>
              <label>
                <span>Tescil Belge No</span>
                <input value={vehicleForm.tescilBelgeNo ?? ''} onChange={(event) => setVehicleForm({ ...vehicleForm, tescilBelgeNo: event.target.value })} maxLength={50} />
              </label>
              <label>
                <span>Pasif Nedeni</span>
                <textarea value={vehicleForm.pasifNedeni ?? ''} onChange={(event) => setVehicleForm({ ...vehicleForm, pasifNedeni: event.target.value })} />
              </label>
              <label>
                <span>Satış Tarihi</span>
                <input type="date" max={getTodayString()} value={vehicleForm.satisTarihi ?? getTodayString()} onChange={(event) => setVehicleForm({ ...vehicleForm, satisTarihi: event.target.value })} />
              </label>
            </div>
            <div className="actions-row">
              <button type="submit" className="primary" disabled={savingVehicle}>{savingVehicle ? 'Kaydediliyor...' : isEditing ? 'Güncelle' : 'Kaydet'}</button>
              {isEditing ? <button type="button" className="danger" onClick={handleVehicleDelete} disabled={deletingVehicle}>{deletingVehicle ? 'Siliniyor...' : 'Sil'}</button> : null}
            </div>
          </form>
        ) : null}

        {activeTab === 'maintenance' ? (
          <div className="tab-content">
            {selectedVehicle ? <h3>{selectedVehicle.plaka} - Bakım Kayıtları</h3> : <p className="empty">Önce bir araç seçin.</p>}
            {selectedVehicle ? (
              <>
                {loadingMaintenance ? <p>Yükleniyor...</p> : maintenanceRecords.length === 0 ? <p className="empty">Bakım kaydı bulunamadı.</p> : (
                  <table>
                    <thead>
                      <tr>
                        <th>Bakım Tarihi</th>
                        <th>Yapılan İşlemler</th>
                        <th>Ücret</th>
                        <th>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {maintenanceRecords.map((record) => (
                        <tr key={record.id}>
                          <td>{formatDate(record.bakimTarihi)}</td>
                          <td>{record.yapilanIslemler}</td>
                          <td>{record.maliyet !== null ? formatCurrency(record.maliyet) : '-'}</td>
                          <td><button type="button" className="danger small" onClick={() => void handleMaintenanceDelete(record.id)}>Sil</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <form onSubmit={handleMaintenanceSubmit} className="nested-form">
                  <h4>+ Yeni Bakım Girişi</h4>
                  <div className="form-grid compact">
                    <label>
                      <span>Bakım Tarihi <span className="required">*</span></span>
                      <input type="date" max={getTodayString()} value={maintenanceForm.bakimTarihi} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, bakimTarihi: event.target.value })} />
                    </label>
                    <label>
                      <span>Yapılan İşlemler <span className="required">*</span></span>
                      <textarea value={maintenanceForm.yapilanIslemler} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, yapilanIslemler: event.target.value })} />
                    </label>
                    <label>
                      <span>Ücret</span>
                      <input type="number" value={maintenanceForm.maliyet} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, maliyet: event.target.value })} />
                    </label>
                  </div>
                  <button type="submit" className="primary" disabled={savingMaintenance}>{savingMaintenance ? 'Kaydediliyor...' : 'Kaydet'}</button>
                </form>
              </>
            ) : null}
          </div>
        ) : null}

        {activeTab === 'contract' ? (
          <div className="tab-content">
            {selectedVehicle ? <h3>{selectedVehicle.plaka} - Sözleşme Kayıtları</h3> : <p className="empty">Önce bir araç seçin.</p>}
            {selectedVehicle ? (
              <>
                {loadingContracts ? <p>Yükleniyor...</p> : contractRecords.length === 0 ? <p className="empty">Sözleşme kaydı bulunamadı.</p> : (
                  <table>
                    <thead>
                      <tr>
                        <th>Sözleşme Tarihi</th>
                        <th>Araç Kiralayan</th>
                        <th>Yetkili Adı Soyadı</th>
                        <th>Unvan</th>
                        <th>Kiralama Tarihi</th>
                        <th>Dönüş Tarihi</th>
                        <th>Kira Süresi (Gün)</th>
                        <th>Kira Bedeli (Günlük/KDV Hariç)</th>
                        <th>Ödenecek Toplam Tutar</th>
                        <th>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contractRecords.map((record) => (
                        <tr key={record.id}>
                          <td>{formatDate(record.sozlesmeTarihi)}</td>
                          <td>{record.aracKiralayan}</td>
                          <td>{record.yetkiliAdSoyad}</td>
                          <td>{record.unvan}</td>
                          <td>{formatDate(record.kiralamaTarihi)}</td>
                          <td>{formatDate(record.donusTarihi)}</td>
                          <td>{record.kiraSuresiGun}</td>
                          <td>{formatCurrency(record.kiraBedeliGunlukKdvHaric)}</td>
                          <td>{formatCurrency(record.odenecekToplamTutar)}</td>
                          <td><button type="button" className="danger small" onClick={() => void handleContractDelete(record.id)}>Sil</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <form onSubmit={handleContractSubmit} className="nested-form">
                  <h4>+ Yeni Sözleşme Girişi</h4>
                  <div className="form-grid compact two-columns">
                    <label><span>Sözleşme Tarihi <span className="required">*</span></span><input type="date" max={getTodayString()} value={contractForm.sozlesmeTarihi} onChange={(event) => setContractForm({ ...contractForm, sozlesmeTarihi: event.target.value })} /></label>
                    <label><span>Yetkili Ad Soyad <span className="required">*</span></span><input value={contractForm.yetkiliAdSoyad} onChange={(event) => setContractForm({ ...contractForm, yetkiliAdSoyad: event.target.value })} /></label>
                    <label><span>Araç Kiralayan <span className="required">*</span></span><input value={contractForm.aracKiralayan} onChange={(event) => setContractForm({ ...contractForm, aracKiralayan: event.target.value })} /></label>
                    <label><span>Unvan</span><input value={contractForm.unvan} onChange={(event) => setContractForm({ ...contractForm, unvan: event.target.value })} /></label>
                    <label><span>Vergi Dairesi</span><input value={contractForm.vergiDairesi} onChange={(event) => setContractForm({ ...contractForm, vergiDairesi: event.target.value })} /></label>
                    <label><span>TCKN</span><input value={contractForm.tckn} onChange={(event) => setContractForm({ ...contractForm, tckn: event.target.value })} /></label>
                    <label><span>Vergi No</span><input value={contractForm.vergiNo} onChange={(event) => setContractForm({ ...contractForm, vergiNo: event.target.value })} /></label>
                    <label><span>Telefon</span><input value={contractForm.telefon} onChange={(event) => setContractForm({ ...contractForm, telefon: event.target.value })} /></label>
                    <label><span>Adres</span><textarea value={contractForm.adres} onChange={(event) => setContractForm({ ...contractForm, adres: event.target.value })} /></label>
                    <label><span>Kullanıcı</span><input value={contractForm.kullanici} onChange={(event) => setContractForm({ ...contractForm, kullanici: event.target.value })} /></label>
                    <label><span>Kiralama Tarihi <span className="required">*</span></span><input type="date" value={contractForm.kiralamaTarihi} onChange={(event) => setContractForm({ ...contractForm, kiralamaTarihi: event.target.value })} /></label>
                    <label><span>Başlangıç KM</span><input type="number" value={contractForm.baslangicKm} onChange={(event) => setContractForm({ ...contractForm, baslangicKm: event.target.value })} /></label>
                    <label><span>Dönüş KM</span><input type="number" value={contractForm.donusKm} onChange={(event) => setContractForm({ ...contractForm, donusKm: event.target.value })} /></label>
                    <label><span>Kira Süresi (Gün) <span className="required">*</span></span><input type="number" value={contractForm.kiraSuresiGun} onChange={(event) => setContractForm({ ...contractForm, kiraSuresiGun: event.target.value })} /></label>
                    <label><span>Kira Bedeli (Günlük/KDV Hariç) <span className="required">*</span></span><input type="number" value={contractForm.kiraBedeliGunlukKdvHaric} onChange={(event) => setContractForm({ ...contractForm, kiraBedeliGunlukKdvHaric: event.target.value })} /></label>
                    <label><span>Lastik</span><input value={contractForm.lastik} onChange={(event) => setContractForm({ ...contractForm, lastik: event.target.value })} /></label>
                  </div>
                  <button type="submit" className="primary" disabled={savingContract}>{savingContract ? 'Kaydediliyor...' : 'Kaydet'}</button>
                </form>
              </>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default App
