package com.nikelaj.arac_kayit.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
@Entity
@Table(
        name = "araclar",
        indexes = {
                @Index(name = "idx_arac_durum", columnList = "durum"),
                @Index(name = "idx_arac_model_yili", columnList = "model_yili")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"maintenanceRecords", "contractInfos"})
@SuperBuilder
public class Vehicle extends BaseEntity {

    @NotBlank(message = "Plaka alanı boş bırakılamaz")
    @Pattern(
            regexp =         "^(0[1-9]|[1-7]\\d|8[01])\\s?([A-PR-VYZ]\\s?\\d{4,5}|[A-PR-VYZ]{2}\\s?\\d{2,4}|[A-PR-VYZ]{3}\\s?\\d{2,3})$"
            ,
            message = "Geçersiz plaka formatı."
    )
    @Column(nullable = false, unique = true, length = 15)
    private String plaka;

    @NotBlank(message = "Marka alanı zorunludur")
    @Column(nullable = false, length = 50)
    private String marka;

    @NotBlank(message = "Model alanı zorunludur")
    @Column(nullable = false, length = 50)
    private String model;

    @NotNull(message = "Model yılı zorunludur")
    @Min(value = 1900, message = "Geçersiz model yılı")
    @Column(name = "model_yili", nullable = false)
    private Integer modelYili;

        @Column(length = 100)
    private String tipi;

    @NotNull(message = "KM bilgisi zorunludur")
    @Min(value = 0, message = "Kilometre negatif olamaz")
    @Column(nullable = false)
    private Integer km;

    @NotNull(message = "Muayene tarihi zorunludur")
    @Column(name = "muayene_tarihi", nullable = false)
    private LocalDate muayeneTarihi;

    @NotNull(message = "Tescil tarihi zorunludur")
    @Column(name = "tescil_tarihi", nullable = false)
    private LocalDate tescilTarihi;

    @Column(name = "lastik_bilgisi", length = 50)
    private String lastikBilgisi;

    @Column(columnDefinition = "TEXT")
    private String ekspertiz;

    @NotNull(message = "Araç durumu seçilmelidir")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VehicleStatus durum;

    @Builder.Default
    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("bakimTarihi DESC")
    private List<MaintenanceRecord> maintenanceRecords = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sozlesmeTarihi DESC")
    private List<ContractInfo> contractInfos = new ArrayList<>();

    @PrePersist
    @PreUpdate
    private void normalizePlaka() {
        if (plaka != null) {
            plaka = plaka.replaceAll("\\s+", "").toUpperCase();
        }
    }

    public void addMaintenanceRecord(MaintenanceRecord record) {
        maintenanceRecords.add(record);
        record.setVehicle(this);
    }

    public void removeMaintenanceRecord(MaintenanceRecord record) {
        maintenanceRecords.remove(record);
        record.setVehicle(null);
    }

    public void addContractInfo(ContractInfo contract) {
        contractInfos.add(contract);
        contract.setVehicle(this);
    }


    public void removeContractInfo(ContractInfo contract) {
        contractInfos.remove(contract);
        contract.setVehicle(null);
    }
}