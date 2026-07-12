package com.nikelaj.arac_kayit.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MaintenanceRecordResponse(
        Long id,
        LocalDate bakimTarihi,
        String yapilanIslemler,
        BigDecimal maliyet
) {}