package com.nikelaj.arac_kayit.dto;

import com.nikelaj.arac_kayit.entity.VehicleStatus;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record VehicleRequest(

        @NotBlank(message = "Plaka alanı boş bırakılamaz")
        @Pattern(
                regexp =         "^(0[1-9]|[1-7]\\d|8[01])\\s?([A-PR-VYZ]\\s?\\d{4,5}|[A-PR-VYZ]{2}\\s?\\d{2,4}|[A-PR-VYZ]{3}\\s?\\d{2,3})$",
                message = "Geçersiz plaka formatı."
        )
        String plaka,

        @NotBlank(message = "Marka alanı zorunludur")
        @Size(max = 50)
        String marka,

        @NotBlank(message = "Model alanı zorunludur")
        @Size(max = 50)
        String model,

        @NotNull(message = "Model yılı zorunludur")
        @Min(value = 1900, message = "Geçersiz model yılı")
        Integer modelYili,

        @Size(max = 100)
        String tipi,

        @NotNull(message = "KM bilgisi zorunludur")
        @Min(value = 0, message = "Kilometre negatif olamaz")
        Integer km,

        @NotNull(message = "Muayene tarihi zorunludur")
        LocalDate muayeneTarihi,

        @NotNull(message = "Tescil tarihi zorunludur")
        LocalDate tescilTarihi,

        @Size(max = 50)
        String lastikBilgisi,

        String ekspertiz,

        @NotNull(message = "Araç durumu seçilmelidir")
        VehicleStatus durum
) {}
