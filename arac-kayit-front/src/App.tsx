import { useEffect, useMemo, useState, type FormEvent } from 'react'
import './App.css'
import { createVehicle, deleteVehicle, getMarkalar, getModeller, getVehicles, updateVehicle } from './api/vehicleApi'
import { createMaintenanceRecord, deleteMaintenanceRecord, getMaintenanceRecords } from './api/maintenanceApi'
import { createContractRecord, deleteContractRecord, getContractRecords } from './api/contractApi'
import type { VehicleRequest, VehicleResponse } from './types/vehicle'
import type { MaintenanceRecordResponse } from './types/maintenance'
import type { ContractInfoResponse } from './types/contract'
import { formatCurrency, formatDate, getTodayString, normalizePlaka } from './utils/dateFormat'
import Bildirim from './components/Bildirim'
import CurrencyInput from 'react-currency-input-field'
import {
  exportVehiclesToPdf, exportVehiclesToCsv,
  exportMaintenanceToPdf, exportContractsToPdf,
  downloadVehicleImportTemplate, parseVehicleBulkCsv
} from './utils/exportUtils'

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
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const pageSize = 10
  const [markalar, setMarkalar] = useState<string[]>([])
  const [modeller, setModeller] = useState<string[]>([])

  const [isModalOpen, setIsModalOpen] = useState(false)

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
    void loadVehicles(0)
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false)
      }
    }

    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isModalOpen])
  // Marka listesi sayfa açılınca bir kere çekilir
  useEffect(() => {
    getMarkalar().then(setMarkalar).catch(() => setMarkalar([]))
  }, [])

  // Kullanıcı marka yazdıkça (veya bir satır seçilince) o markaya ait
  // modelleri getirir. 300ms debounce ile her tuşta API'ye gitmez.
  useEffect(() => {
    const marka = vehicleForm.marka.trim()
    if (!marka) {
      setModeller([])
      return
    }
    const timer = window.setTimeout(() => {
      getModeller(marka).then(setModeller).catch(() => setModeller([]))
    }, 300)
    return () => window.clearTimeout(timer)
  }, [vehicleForm.marka])

  const loadVehicles = async (currentPage = 0) => {
    setLoadingVehicles(true)
    try {
      const data = await getVehicles({
        plaka: filters.plaka || undefined,
        modelYili: filters.modelYili ? Number(filters.modelYili) : undefined,
        durum: filters.durum || undefined,
        page: currentPage,
        size: pageSize
      })
      setVehicles(data.content)
      setTotalPages(data.totalPages)
      setTotalElements(data.totalElements)
      setPage(currentPage)
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

  // --- YENİ EKLENEN: Tüm araçları tek seferde çekip export eden fonksiyonlar ---
  const fetchAllFilteredVehicles = async () => {
    const data = await getVehicles({
      plaka: filters.plaka || undefined,
      modelYili: filters.modelYili ? Number(filters.modelYili) : undefined,
      durum: filters.durum || undefined,
      page: 0,
      size: 100000 // Tüm kayıtları getirmesi için yüksek bir değer
    })
    return data.content
  }

  const handleExportAllToCsv = async () => {
    try {
      setLoadingVehicles(true)
      const allVehicles = await fetchAllFilteredVehicles()
      exportVehiclesToCsv(allVehicles)
    } catch (error) {
      setBanner({ type: 'error', title: 'Dışa Aktarım Başarısız', message: 'Tüm veriler çekilemedi.' })
    } finally {
      setLoadingVehicles(false)
    }
  }

  const handleExportAllToPdf = async () => {
    try {
      setLoadingVehicles(true)
      const allVehicles = await fetchAllFilteredVehicles()
      exportVehiclesToPdf(allVehicles)
    } catch (error) {
      setBanner({ type: 'error', title: 'Dışa Aktarım Başarısız', message: 'Tüm veriler çekilemedi.' })
    } finally {
      setLoadingVehicles(false)
    }
  }
  // --------------------------------------------------------------------------

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
    setIsModalOpen(true)
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
      setIsModalOpen(false)
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
    setIsModalOpen(true)
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

  // 1. Standart inputlar için merkezi handler
  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setContractForm((prev) => ({ ...prev, [name]: value }));
  };

  // 2. Özel validasyon gerektirenler için spesifik handler'lar
  const handleTcknChange = (e: any) => {
    const val = e.target.value;
    if (/^\d{0,11}$/.test(val)) setContractForm((prev) => ({ ...prev, tckn: val }));
  };

  const handleVergiNoChange = (e: any) => {
    const val = e.target.value;
    if (/^\d{0,10}$/.test(val)) setContractForm((prev) => ({ ...prev, vergiNo: val }));
  };

  const handlePhoneChange = (e: any) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.startsWith('0')) val = val.substring(1);
    val = val.substring(0, 10);
    setContractForm((prev) => ({ ...prev, telefon: val }));
  };

  const handleBulkImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setLoadingVehicles(true)
      const data = await parseVehicleBulkCsv(file)

      let successCount = 0
      let errorCount = 0

      for (const row of data) {
        try {
          const payload: VehicleRequest = {
            plaka: row['plaka']?.toUpperCase() || '',
            marka: row['marka'] || '',
            model: row['model'] || '',
            modelYili: Number(row['modelYili']) || new Date().getFullYear(),
            tipi: row['tipi'] || '',
            km: Number(row['km']) || 0,
            muayeneTarihi: row['muayeneTarihi(YYYY-MM-DD)'] || getTodayString(),
            tescilTarihi: row['tescilTarihi(YYYY-MM-DD)'] || getTodayString(),
            durum: (row['durum(AKTIF/PASIF/SATILDI)'] as VehicleRequest['durum']) || 'AKTIF',
            lastikBilgisi: null,
            ekspertiz: null,
            tescilBelgeNo: null,
            pasifNedeni: null,
            satisTarihi: null
          }

          if (payload.plaka && payload.marka) {
            await createVehicle(payload)
            successCount++
          }
        } catch (err) {
          errorCount++
        }
      }

      setBanner({
        type: successCount > 0 ? 'success' : 'error',
        title: 'Toplu İçe Aktarma Tamamlandı',
        message: `${successCount} araç eklendi, ${errorCount} araçta hata oluştu.`
      })
      await loadVehicles(0)
    } catch (error) {
      setBanner({ type: 'error', title: 'CSV Okuma Hatası', message: 'Dosya formatı geçersiz.' })
    } finally {
      setLoadingVehicles(false)
      event.target.value = ''
    }
  }
  const formatPhoneNumber = (value: any) => {
    if (!value) return value;
    let cleaned = value.replace(/\D/g, '');
    if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);

    const len = cleaned.length;
    if (len < 4) return cleaned;
    if (len < 7) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    if (len < 9) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
  };
  const handleVehicleChange = (e: any) => {
    const { name, value, type } = e.target;

    setVehicleForm((prev) => {
      let finalValue = value;

      // Plaka: Boşlukları sil ve büyük harf yap
      if (name === 'plaka') {
        finalValue = value.replace(/\s/g, '').toUpperCase();
      }

      // Sayısal alanlar (KM, Model Yılı): İçeriği silince 0 olmasını engelle
      if (type === 'number') {
        finalValue = value === '' ? '' : Number(value);
      }

      return { ...prev, [name]: finalValue };
    });
  };

  // --- BAKIM FORMU İÇİN MERKEZİ HANDLER ---
  const handleMaintenanceChange = (e: any) => {
    const { name, value } = e.target;
    setMaintenanceForm((prev) => ({ ...prev, [name]: value }));
  };

  const summaryText = useMemo(() => `${totalElements} araç bulundu`, [totalElements])
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
          <button type="button" onClick={() => void loadVehicles(0)} disabled={loadingVehicles}>
            {loadingVehicles ? 'Yükleniyor...' : 'Listele'}
          </button>
          <button type="button" className="secondary" onClick={() => {
            setFilters({ plaka: '', modelYili: '', durum: '' })
            void loadVehicles(0)
          }}>
            Temizle
          </button></div>
      </section>

      <section className="panel">
        <div className="panel-header inline">
          <h2>Araç Listesi</h2>
          <div className="panel-actions">
            <span className="muted">{summaryText}</span>
            <button type="button" className="primary" onClick={clearVehicleForm}>+ Yeni Araç Girişi</button>
            {/* --- GÜNCELLENDİ: Sadece mevcut sayfadaki araçları değil, tüm DB'yi çeken fonksiyonlar bağlandı --- */}
            <button type="button" className="secondary small" onClick={handleExportAllToCsv}>CSV İndir</button>
            <button type="button" className="secondary small" onClick={handleExportAllToPdf}>PDF İndir</button>
            {/* ------------------------------------------------------------------------------------------------- */}
            <button type="button" className="secondary small" onClick={downloadVehicleImportTemplate}>Şablon İndir</button>
            <label className="secondary small button-like" style={{ cursor: 'pointer', display: 'inline-block', padding: '0.4rem 0.8rem', border: '1px solid #ccc', borderRadius: '4px' }}>
              Toplu Yükle (CSV)
              <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleBulkImport} />
            </label>
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
        {totalPages > 1 && (
          <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '1rem', alignItems: 'center' }}>
            <button
              type="button"
              className="secondary small"
              disabled={page === 0 || loadingVehicles}
              onClick={() => void loadVehicles(page - 1)}
            >
              Önceki
            </button>

            <span className="muted" style={{ fontSize: '0.9rem' }}>
              Sayfa {page + 1} / {totalPages}
            </span>

            <button
              type="button"
              className="secondary small"
              disabled={page >= totalPages - 1 || loadingVehicles}
              onClick={() => void loadVehicles(page + 1)}
            >
              Sonraki
            </button>
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>

            <div className="panel-header inline">
              <div>
                <h2>{isEditing && selectedVehicle ? `${selectedVehicle.plaka} - Araç Detayı` : 'Yeni Araç Kayıt Formu'}</h2>
                <p className="muted">Araç, bakım ve sözleşme bilgilerini yönetin.</p>
              </div>

            </div>

            <div className="tabs">
              <button type="button" className={activeTab === 'vehicle' ? 'tab active' : 'tab'} onClick={() => setActiveTab('vehicle')}>Araç Bilgisi</button>
              <button type="button" className={activeTab === 'maintenance' ? 'tab active' : 'tab'} disabled={!selectedVehicle} onClick={() => setActiveTab('maintenance')} title={!selectedVehicle ? 'Önce aracı kaydedin' : ''}>Bakım Bilgisi</button>
              <button type="button" className={activeTab === 'contract' ? 'tab active' : 'tab'} disabled={!selectedVehicle} onClick={() => setActiveTab('contract')} title={!selectedVehicle ? 'Önce aracı kaydedin' : ''}>Sözleşme Bilgisi</button>
            </div>

            {activeTab === 'vehicle' ? (
              
              <form onSubmit={handleVehicleSubmit} className="vehicle-form">
                {/* Araç formu da sözleşme gibi 3 kolonlu ve compact hale getirildi */}
                <div className="form-grid compact three-columns">
                  <label>
                    <span>Plaka <span className="required">*</span></span>
                    <input name="plaka" value={vehicleForm.plaka} onChange={handleVehicleChange} maxLength={20} placeholder="Örn: 34ABC123" />
                    {formErrors.plaka ? <small className="error-text">{formErrors.plaka}</small> : null}
                  </label>

                  <label>
                    <span>Marka <span className="required">*</span></span>
                    <input
                      name="marka"
                      list="marka-onerileri"
                      autoComplete="off"
                      value={vehicleForm.marka}
                      onChange={handleVehicleChange}
                      maxLength={50}
                      placeholder="Örn: Renault"
                    />
                    <datalist id="marka-onerileri">
                      {markalar.map((m) => <option key={m} value={m} />)}
                    </datalist>
                    {formErrors.marka ? <small className="error-text">{formErrors.marka}</small> : null}
                  </label>

                  <label>
                    <span>Model <span className="required">*</span></span>
                    <input
                      name="model"
                      list="model-onerileri"
                      autoComplete="off"
                      value={vehicleForm.model}
                      onChange={handleVehicleChange}
                      maxLength={50}
                      placeholder="Örn: Megane"
                    />
                    <datalist id="model-onerileri">
                      {modeller.map((m) => <option key={m} value={m} />)}
                    </datalist>
                    {formErrors.model ? <small className="error-text">{formErrors.model}</small> : null}
                  </label>

                  <label>
                    <span>Model Yılı <span className="required">*</span></span>
                    <input type="number" name="modelYili" value={vehicleForm.modelYili ?? ''} onChange={handleVehicleChange} min="1900" max={new Date().getFullYear()} placeholder="Örn: 2023" />
                    {formErrors.modelYili ? <small className="error-text">{formErrors.modelYili}</small> : null}
                  </label>

                  <label>
                    <span>Tipi <span className="required">*</span></span>
                    <input name="tipi" value={vehicleForm.tipi} onChange={handleVehicleChange} maxLength={100} placeholder="Örn: 1.3 TCe Icon" />
                    {formErrors.tipi ? <small className="error-text">{formErrors.tipi}</small> : null}
                  </label>

                  <label>
                    <span>KM</span>
                    <input type="number" name="km" value={vehicleForm.km ?? ''} onChange={handleVehicleChange} min="0" max="999999" placeholder="Örn: 125000" />
                    {formErrors.km ? <small className="error-text">{formErrors.km}</small> : null}
                  </label>

                  <label>
                    <span>Muayene Tarihi <span className="required">*</span></span>
                    <input type="date" name="muayeneTarihi" value={vehicleForm.muayeneTarihi} onChange={handleVehicleChange} />
                    {formErrors.muayeneTarihi ? <small className="error-text">{formErrors.muayeneTarihi}</small> : null}
                  </label>

                  <label>
                    <span>Satış Tarihi</span>
                    <input type="date" name="satisTarihi" max={getTodayString()} value={vehicleForm.satisTarihi ?? ''} onChange={handleVehicleChange} />
                  </label>

                  <label>
                    <span>Lastik</span>
                    <input name="lastikBilgisi" value={vehicleForm.lastikBilgisi ?? ''} onChange={handleVehicleChange} placeholder="Örn: 205x55x16" />
                  </label>

                  <label>
                    <span>Tescil Tarihi <span className="required">*</span></span>
                    <input type="date" name="tescilTarihi" max={getTodayString()} value={vehicleForm.tescilTarihi} onChange={handleVehicleChange} />
                    {formErrors.tescilTarihi ? <small className="error-text">{formErrors.tescilTarihi}</small> : null}
                  </label>

                  <label>
                    <span>Durumu <span className="required">*</span></span>
                    <select name="durum" value={vehicleForm.durum} onChange={handleVehicleChange}>
                      {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                    {formErrors.durum ? <small className="error-text">{formErrors.durum}</small> : null}
                  </label>

                  <label>
                    <span>Tescil Belge No</span>
                    <input name="tescilBelgeNo" value={vehicleForm.tescilBelgeNo ?? ''} onChange={handleVehicleChange} maxLength={50} placeholder="Örn: AB123456" />
                  </label>

                  <label className="full-width">
                    <span>Pasif Nedeni</span>
                    <textarea name="pasifNedeni" value={vehicleForm.pasifNedeni ?? ''} onChange={handleVehicleChange} placeholder="Eğer araç pasife çekildiyse nedenini belirtin (Örn: Kazalı, perte ayrıldı, motor arızası vb.)" />
                  </label>

                  <label className="full-width">
                    <span>Ekspertiz</span>
                    <textarea name="ekspertiz" value={vehicleForm.ekspertiz ?? ''} onChange={handleVehicleChange} placeholder="Değişen/boyalı parçalar, tramer kaydı, güncel hasar durumu vb." />
                  </label>

                </div>
                <div className="actions-row">
                  <button type="submit" className="primary" disabled={savingVehicle}>{savingVehicle ? 'Kaydediliyor...' : isEditing ? 'Güncelle' : 'Kaydet'}</button>
                  {isEditing ? <button type="button" className="danger" onClick={handleVehicleDelete} disabled={deletingVehicle}>{deletingVehicle ? 'Siliniyor...' : 'Sil'}</button> : null}
                </div>
              </form>
            ) : null}

            {activeTab === 'maintenance' && selectedVehicle ? (
              <div className="tab-content">
                {/* Header Alanı */}


                {/* YENİ SIRALAMA: 1. Form (Üstte) */}
                <form onSubmit={handleMaintenanceSubmit} className="nested-form" style={{ marginBottom: '2rem' }}>
                  <h4>+ Yeni Bakım Girişi</h4>
                  <div className="form-grid compact">
                    <label>
                      <span>Bakım Tarihi <span className="required">*</span></span>
                      <input type="date" name="bakimTarihi" max={getTodayString()} value={maintenanceForm.bakimTarihi} onChange={handleMaintenanceChange} />
                    </label>

                    <label>
                      <span>Ücret</span>
                      <CurrencyInput
                        id="maliyet"
                        name="maliyet"
                        placeholder="Örn: 1500"
                        value={maintenanceForm.maliyet}
                        suffix=" ₺"
                        decimalsLimit={2}
                        onValueChange={(value) => setMaintenanceForm((prev) => ({ ...prev, maliyet: value || '' }))}
                      />
                    </label>
                    <label>
                      <span>Yapılan İşlemler <span className="required">*</span></span>
                      <textarea name="yapilanIslemler" placeholder='Ör: Yağ değişimi' value={maintenanceForm.yapilanIslemler} onChange={handleMaintenanceChange} />
                    </label>
                  </div>
                  <button type="submit" className="primary" disabled={savingMaintenance}>{savingMaintenance ? 'Kaydediliyor...' : 'Kaydet'}</button>

                </form>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>Bakım Geçmişi</h3>
                  {maintenanceRecords.length > 0 && (
                    <button type="button" className="secondary small" onClick={() => exportMaintenanceToPdf(maintenanceRecords, selectedVehicle.plaka)}>PDF İndir</button>
                  )}
                </div>
                {/* YENİ SIRALAMA: 2. Tablo (Altta) ve %100 Genişlik */}
                {loadingMaintenance ? <p>Yükleniyor...</p> : maintenanceRecords.length === 0 ? <p className="empty">Bakım kaydı bulunamadı.</p> : (
                  <table style={{ width: '100%', textAlign: 'left' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '25rem' }}>Bakım Tarihi</th>
                        <th style={{ width: '25rem' }}>Yapılan İşlemler</th>
                        <th style={{ width: '25rem' }}>Ücret</th>
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
              </div>
            ) : null}

            {activeTab === 'contract' && selectedVehicle ? (
              <div className="tab-content">
                <form onSubmit={handleContractSubmit} className="nested-form">
                  <h4>+ Yeni Sözleşme Girişi</h4>
                  <div className="form-grid compact three-columns">
                    {/* --- SÖZLEŞME & KİŞİ BİLGİLERİ --- */}
                    <label>
                      <span>Sözleşme Tarihi <span className="required">*</span></span>
                      <input type="date" name="sozlesmeTarihi" max={getTodayString()} value={contractForm.sozlesmeTarihi} onChange={handleInputChange} />
                    </label>
                    <label>
                      <span>Yetkili Ad Soyad <span className="required">*</span></span>
                      <input type="text" name="yetkiliAdSoyad" placeholder="Ör: Selami Yıldırım" value={contractForm.yetkiliAdSoyad} onChange={handleInputChange} />
                    </label>
                    <label>
                      <span>Araç Kiralayan <span className="required">*</span></span>
                      <input type="text" name="aracKiralayan" placeholder="Ör: Selami Yıldırım" value={contractForm.aracKiralayan} onChange={handleInputChange} />
                    </label>

                    <label>
                      <span>Unvan</span>
                      <input type="text" name="unvan" placeholder="Ör: Nikelaj Oto Sanayi A.Ş." value={contractForm.unvan} onChange={handleInputChange} />
                    </label>
                    <label>
                      <span>Vergi Dairesi</span>
                      <input type="text" name="vergiDairesi" placeholder="Yalova Vergi Dairesi" value={contractForm.vergiDairesi} onChange={handleInputChange} />
                    </label>
                    <label>
                      <span>Vergi No</span>
                      <input type="text" name="vergiNo" value={contractForm.vergiNo} onChange={handleVergiNoChange} />
                    </label>

                    <label>
                      <span>TCKN</span>
                      <input type="text" name="tckn" value={contractForm.tckn} onChange={handleTcknChange} />
                    </label>
                    <label>
                      <span>Telefon</span>
                      <input type="tel" name="telefon" placeholder="(5XX) XXX XX XX" value={formatPhoneNumber(contractForm.telefon)} onChange={handlePhoneChange} />
                    </label>
                    <label>
                      <span>Kullanıcı</span>
                      <input type="text" name="kullanici" value={contractForm.kullanici} onChange={handleInputChange} />
                    </label>

                    <label className="full-width">
                      <span>Adres</span>
                      <textarea name="adres" value={contractForm.adres} onChange={handleInputChange} />
                    </label>

                    {/* --- KİRALAMA & ARAÇ DETAYLARI --- */}
                    <label>
                      <span>Kiralama Tarihi <span className="required">*</span></span>
                      <input type="date" name="kiralamaTarihi" value={contractForm.kiralamaTarihi} onChange={handleInputChange} />
                    </label>
                    <label>
                      <span>Kira Süresi (Gün) <span className="required">*</span></span>
                      <input type="number" name="kiraSuresiGun" min="0" value={contractForm.kiraSuresiGun} onChange={handleInputChange} />
                    </label>
                    <label>
                      <span>Kira Bedeli (Günlük) <span className="required">*</span></span>
                      <CurrencyInput
                        id="kiraBedeliGunlukKdvHaric"
                        name="kiraBedeliGunlukKdvHaric"
                        placeholder="Örn: 1200"
                        value={contractForm.kiraBedeliGunlukKdvHaric}
                        suffix=" ₺"
                        decimalsLimit={2}
                        onValueChange={(value) => setContractForm((prev) => ({ ...prev, kiraBedeliGunlukKdvHaric: value || '' }))}
                      />
                    </label>

                    <label>
                      <span>Başlangıç KM</span>
                      <input type="number" name="baslangicKm" min="0" value={contractForm.baslangicKm} onChange={handleInputChange} />
                    </label>
                    <label>
                      <span>Dönüş KM</span>
                      <input type="number" name="donusKm" min="0" value={contractForm.donusKm} onChange={handleInputChange} />
                    </label>
                    <label>
                      <span>Lastik</span>
                      <input type="text" name="lastik" placeholder="Ör: 210x55x17" value={contractForm.lastik} onChange={handleInputChange} />
                    </label>
                  </div>

                  <button type="submit" className="primary" disabled={savingContract}>{savingContract ? 'Kaydediliyor...' : 'Kaydet'}</button>
                </form>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>Sözleşme Geçmişi</h3>
                  {contractRecords.length > 0 && (
                    <button type="button" className="secondary small" onClick={() => exportContractsToPdf(contractRecords, selectedVehicle.plaka)}>PDF İndir</button>
                  )}
                </div>

                {loadingContracts ? <p>Yükleniyor...</p> : contractRecords.length === 0 ? <p className="empty">Sözleşme kaydı bulunamadı.</p> : (
                  <table style={{ width: '100%', tableLayout: 'fixed', textAlign: 'left' }}>
                    <thead>
                      <tr>
                        <th>Sözleşme Tarihi</th>
                        <th>Araç Kiralayan</th>
                        <th>Yetkili Adı Soyadı</th>
                        <th>Kiralama Tarihi</th>
                        <th>Dönüş Tarihi</th>
                        <th>Kira Süresi (Gün)</th>
                        <th>Günlük Bedel</th>
                        <th>Toplam Tutar</th>
                        <th>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contractRecords.map((record) => (
                        <tr key={record.id}>
                          <td>{formatDate(record.sozlesmeTarihi)}</td>
                          <td style={{ wordWrap: 'break-word' }}>{record.aracKiralayan}</td>
                          <td style={{ wordWrap: 'break-word' }}>{record.yetkiliAdSoyad}</td>
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
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

export default App