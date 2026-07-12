package com.nikelaj.arac_kayit.dto;

import com.nikelaj.arac_kayit.entity.VehicleStatus;

public record VehicleSearchRequest(
        String plaka,
        Integer modelYili,
        VehicleStatus durum
) {}