package com.nikelaj.arac_kayit.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ContractInfoResponse(
        Long id,
        LocalDate sozlesmeTarihi,
        String aracKiralayan,
        String vergiDairesi,
        String vergiNo,
        String adres,
        String yetkiliAdSoyad,
        String unvan,
        String tckn,
        String telefon,
        String kullanici,
        LocalDate kiralamaTarihi,
        Integer baslangicKm,
        Integer donusKm,
        Integer kiraSuresiGun,
        BigDecimal kiraBedeliGunlukKdvHaric,
        String lastik,
        LocalDate donusTarihi,
        BigDecimal odenecekToplamTutar,
        Long vehicleId
) {}