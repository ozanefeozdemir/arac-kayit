package com.nikelaj.arac_kayit.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.time.LocalDate;


import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Entity
@Table(name = "sozlesmeler")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@ToString(exclude = "vehicle")
public class ContractInfo extends BaseEntity {

    // --- Sözleşme / Kiralayan Bilgileri ---

    @NotNull(message = "Sözleşme tarihi zorunludur")
    @Column(name = "sozlesme_tarihi", nullable = false)
    private LocalDate sozlesmeTarihi;

    @NotBlank(message = "Araç kiralayan zorunludur")
    @Column(name = "arac_kiralayan", nullable = false, length = 150)
    private String aracKiralayan;

    @Column(name = "vergi_dairesi", length = 100)
    private String vergiDairesi;

    @Pattern(regexp = "^[0-9]{10}$", message = "Vergi no 10 haneli olmalıdır")
    @Column(name = "vergi_no", length = 10)
    private String vergiNo;

    @Column(name = "adres", columnDefinition = "TEXT")
    private String adres;

    @NotBlank(message = "Yetkili ad soyad zorunludur")
    @Column(name = "yetkili_ad_soyad", nullable = false, length = 100)
    private String yetkiliAdSoyad;

    @Column(name = "unvan", length = 100)
    private String unvan;

    @Pattern(regexp = "^[0-9]{11}$", message = "TCKN 11 haneli olmalıdır")
    @Column(name = "tckn", length = 11)
    private String tckn;

    @Pattern(regexp = "^[0-9()+\\-\\s]{10,20}$", message = "Geçerli bir telefon numarası giriniz")
    @Column(name = "telefon", length = 20)
    private String telefon;

    // --- Kiralama Bilgileri ---

    @Column(name = "kullanici", length = 100)
    private String kullanici;

    @NotNull(message = "Kiralama tarihi zorunludur")
    @Column(name = "kiralama_tarihi", nullable = false)
    private LocalDate kiralamaTarihi;

    @PositiveOrZero(message = "Başlangıç km negatif olamaz")
    @Column(name = "baslangic_km")
    private Integer baslangicKm;

    @PositiveOrZero(message = "Dönüş km negatif olamaz")
    @Column(name = "donus_km")
    private Integer donusKm;

    @NotNull(message = "Kira süresi zorunludur")
    @Positive(message = "Kira süresi 0'dan büyük olmalıdır")
    @Column(name = "kira_suresi_gun", nullable = false)
    private Integer kiraSuresiGun;

    @NotNull(message = "Kira bedeli zorunludur")
    @DecimalMin(value = "0.0", inclusive = false, message = "Kira bedeli 0'dan büyük olmalıdır")
    @Column(name = "kira_bedeli_gunluk_kdv_haric", nullable = false, precision = 12, scale = 2)
    private BigDecimal kiraBedeliGunlukKdvHaric;

    @Column(name = "lastik", length = 255)
    private String lastik;

    // --- Türetilmiş alanlar (tabloda listelenmesi için persist ediliyor) ---

    @Column(name = "donus_tarihi")
    private LocalDate donusTarihi;

    @Column(name = "odenecek_toplam_tutar", precision = 14, scale = 2)
    private BigDecimal odenecekToplamTutar;

    // --- İlişki ---

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "arac_id", nullable = false)
    private Vehicle vehicle;

    // --- Çapraz alan doğrulaması ---

    @AssertTrue(message = "Dönüş km, başlangıç km'den küçük olamaz")
    @Transient
    private boolean isKmValid() {
        return baslangicKm == null || donusKm == null || donusKm >= baslangicKm;
    }

    // --- Türetilmiş alanları otomatik hesapla ---

    @PrePersist
    @PreUpdate
    private void hesaplaTuretilmisAlanlar() {
        if (kiralamaTarihi != null && kiraSuresiGun != null) {
            donusTarihi = kiralamaTarihi.plusDays(kiraSuresiGun);
        }
        if (kiraBedeliGunlukKdvHaric != null && kiraSuresiGun != null) {
            odenecekToplamTutar = kiraBedeliGunlukKdvHaric
                    .multiply(BigDecimal.valueOf(kiraSuresiGun))
                    .setScale(2, RoundingMode.HALF_UP);
        }
    }
}