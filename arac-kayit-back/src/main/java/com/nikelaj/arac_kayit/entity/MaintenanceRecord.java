package com.nikelaj.arac_kayit.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;

// MaintenanceRecord.java
@Entity
@Table(name = "bakimlar")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@ToString(exclude = "vehicle")
public class MaintenanceRecord extends BaseEntity {

    @NotNull(message = "Bakım tarihi zorunludur")
    @Column(name = "bakim_tarihi", nullable = false)
    private LocalDate bakimTarihi;

    @NotBlank(message = "Yapılan işlemler alanı boş bırakılamaz")
    @Column(name = "yapilan_islemler", columnDefinition = "TEXT", nullable = false)
    private String yapilanIslemler;

    @DecimalMin(value = "0.0", inclusive = true, message = "Maliyet negatif olamaz")
    @Column(precision = 10, scale = 2)
    private BigDecimal maliyet;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "arac_id", nullable = false)
    private Vehicle vehicle;
}