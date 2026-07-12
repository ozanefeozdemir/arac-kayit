package com.nikelaj.arac_kayit.dto;


import com.nikelaj.arac_kayit.entity.VehicleStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record VehicleResponse(
        Long id,
        String plaka,
        String marka,
        String model,
        Integer modelYili,
        String tipi,
        Integer km,
        LocalDate muayeneTarihi,
        LocalDate tescilTarihi,
        String lastikBilgisi,
        String ekspertiz,
        VehicleStatus durum,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}