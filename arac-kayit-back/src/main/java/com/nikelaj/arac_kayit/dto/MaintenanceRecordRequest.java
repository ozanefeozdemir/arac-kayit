package com.nikelaj.arac_kayit.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MaintenanceRecordRequest(
        @NotNull(message = "Bakım tarihi zorunludur")
        LocalDate bakimTarihi,

        @NotBlank(message = "Yapılan işlemler alanı boş bırakılamaz")
        String yapilanIslemler,

        @DecimalMin(value = "0.0", message = "Maliyet negatif olamaz")
        BigDecimal maliyet
) {}