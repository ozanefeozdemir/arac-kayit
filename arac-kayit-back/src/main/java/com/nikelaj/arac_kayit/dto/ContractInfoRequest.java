package com.nikelaj.arac_kayit.dto;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

import java.math.BigDecimal;

public record ContractInfoRequest(
        @NotNull(message = "Sözleşme tarihi zorunludur")
        LocalDate sozlesmeTarihi,

        @NotBlank(message = "Araç kiralayan zorunludur")
        @Size(max = 150)
        String aracKiralayan,

        @Size(max = 100)
        String vergiDairesi,

        @Pattern(regexp = "^[0-9]{10}$", message = "Vergi no 10 haneli olmalıdır")
        String vergiNo,

        String adres,

        @NotBlank(message = "Yetkili ad soyad zorunludur")
        @Size(max = 100)
        String yetkiliAdSoyad,

        @Size(max = 100)
        String unvan,

        @Pattern(regexp = "^[0-9]{11}$", message = "TCKN 11 haneli olmalıdır")
        String tckn,

        @Pattern(regexp = "^[0-9()+\\-\\s]{10,20}$", message = "Geçerli bir telefon numarası giriniz")
        String telefon,

        @Size(max = 100)
        String kullanici,

        @NotNull(message = "Kiralama tarihi zorunludur")
        LocalDate kiralamaTarihi,

        @PositiveOrZero(message = "Başlangıç km negatif olamaz")
        Integer baslangicKm,

        @PositiveOrZero(message = "Dönüş km negatif olamaz")
        Integer donusKm,

        @NotNull(message = "Kira süresi zorunludur")
        @Positive(message = "Kira süresi 0'dan büyük olmalıdır")
        Integer kiraSuresiGun,

        @NotNull(message = "Kira bedeli zorunludur")
        @DecimalMin(value = "0.0", inclusive = false, message = "Kira bedeli 0'dan büyük olmalıdır")
        BigDecimal kiraBedeliGunlukKdvHaric,

        @Size(max = 255)
        String lastik

) {
    public ContractInfoRequest {
        if (baslangicKm != null && donusKm != null && donusKm < baslangicKm) {
            throw new IllegalArgumentException("Dönüş km, başlangıç km'den küçük olamaz");
        }
    }
}