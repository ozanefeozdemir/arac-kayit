package com.nikelaj.arac_kayit;


import com.nikelaj.arac_kayit.dto.VehicleRequest;
import com.nikelaj.arac_kayit.dto.VehicleResponse;
import com.nikelaj.arac_kayit.entity.Vehicle;
import com.nikelaj.arac_kayit.entity.VehicleStatus;
import com.nikelaj.arac_kayit.exception.DuplicatePlakaException;
import com.nikelaj.arac_kayit.exception.VehicleNotFoundException;
import com.nikelaj.arac_kayit.mapper.VehicleMapper;
import com.nikelaj.arac_kayit.repo.ContractInfoRepo;
import com.nikelaj.arac_kayit.repo.MaintenanceRecordRepo;
import com.nikelaj.arac_kayit.repo.VehicleRepo;
import com.nikelaj.arac_kayit.service.VehicleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VehicleServiceTest {

    @Mock private VehicleRepo vehicleRepo;
    @Mock private MaintenanceRecordRepo maintenanceRecordRepo;
    @Mock private ContractInfoRepo contractInfoRepo;
    @Mock private VehicleMapper vehicleMapper;

    @InjectMocks
    private VehicleService vehicleService;

    private Vehicle vehicle;
    private VehicleRequest request;
    private VehicleResponse response;

    @BeforeEach
    void setUp() {
        vehicle = new Vehicle();
        vehicle.setId(1L);
        vehicle.setPlaka("77AAJ555");
        vehicle.setMarka("FORD");
        vehicle.setModel("FOCUS");
        vehicle.setModelYili(2025);
        vehicle.setTipi("1.5 TDCI TITANYUM X PAKET");
        vehicle.setKm(0);
        vehicle.setMuayeneTarihi(LocalDate.of(2026, 8, 15));
        vehicle.setTescilTarihi(LocalDate.of(2026, 8, 15));
        vehicle.setDurum(VehicleStatus.AKTIF);

        request = new VehicleRequest(
                "77 AAJ 555", "FORD", "FOCUS", 2025,
                "1.5 TDCI TITANYUM X PAKET", 0,
                LocalDate.of(2026, 8, 15), LocalDate.of(2026, 8, 15),
                null, null, VehicleStatus.AKTIF
        );

        response = new VehicleResponse(
                1L, "77AAJ555", "FORD", "FOCUS", 2025,
                "1.5 TDCI TITANYUM X PAKET", 0,
                LocalDate.of(2026, 8, 15), LocalDate.of(2026, 8, 15),
                null, null, VehicleStatus.AKTIF, null, null
        );
    }

    @Test
    void findVehicleById_kayitVarsa_responseDoner() {
        // Arrange
        when(vehicleRepo.findById(1L)).thenReturn(Optional.of(vehicle));
        when(vehicleMapper.toResponse(vehicle)).thenReturn(response);

        // Act
        VehicleResponse result = vehicleService.findVehicleById(1L);

        // Assert
        assertThat(result.plaka()).isEqualTo("77AAJ555");
        verify(vehicleRepo).findById(1L);
    }

    @Test
    void findVehicleById_kayitYoksa_exceptionFirlar() {
        when(vehicleRepo.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> vehicleService.findVehicleById(99L))
                .isInstanceOf(VehicleNotFoundException.class)
                .hasMessageContaining("99");

        verify(vehicleMapper, never()).toResponse(any());
    }

    @Test
    void findVehicleByPlaka_bosluklu_kucukHarfliPlaka_normalizeEdilerekAranir() {
        when(vehicleRepo.findByPlaka("77AAJ555")).thenReturn(Optional.of(vehicle));
        when(vehicleMapper.toResponse(vehicle)).thenReturn(response);

        vehicleService.findVehicleByPlaka("77 aaj 555");

        // Repo'ya normalize edilmiş halin gittiğini doğruluyoruz
        verify(vehicleRepo).findByPlaka("77AAJ555");
    }

    @Test
    void saveVehicle_plakaBenzersizse_kaydeder() {
        when(vehicleRepo.existsByPlaka("77AAJ555")).thenReturn(false);
        when(vehicleMapper.toEntity(request)).thenReturn(vehicle);
        when(vehicleRepo.save(vehicle)).thenReturn(vehicle);
        when(vehicleMapper.toResponse(vehicle)).thenReturn(response);

        VehicleResponse result = vehicleService.saveVehicle(request);

        assertThat(result).isEqualTo(response);
        verify(vehicleRepo).save(vehicle);
    }

    @Test
    void saveVehicle_plakaZatenVarsa_exceptionFirlarKaydetmez() {
        when(vehicleRepo.existsByPlaka("77AAJ555")).thenReturn(true);

        assertThatThrownBy(() -> vehicleService.saveVehicle(request))
                .isInstanceOf(DuplicatePlakaException.class);

        // Kaydetme işleminin hiç çağrılmadığını doğrulamak kritik —
        // aksi halde exception'ın save'den ÖNCE mi SONRA mı fırladığını bilemeyiz
        verify(vehicleRepo, never()).save(any());
    }

    @Test
    void updateVehicle_baskaAracinPlakasiylaCakisirsa_exceptionFirlar() {
        Vehicle baskaArac = new Vehicle();
        baskaArac.setId(2L);
        baskaArac.setPlaka("77AAJ555");

        when(vehicleRepo.findById(1L)).thenReturn(Optional.of(vehicle));
        when(vehicleRepo.findByPlaka("77AAJ555")).thenReturn(Optional.of(baskaArac));

        assertThatThrownBy(() -> vehicleService.updateVehicle(request, 1L))
                .isInstanceOf(DuplicatePlakaException.class);

        verify(vehicleMapper, never()).updateEntityFromRequest(any(), any());
    }

    @Test
    void updateVehicle_kendiPlakasiylaKaydedilirse_hataVermezGuncelInfoDoner() {
        // findByPlaka aracın KENDİSİNİ döndürüyor — id eşleştiği için çakışma sayılmamalı
        when(vehicleRepo.findById(1L)).thenReturn(Optional.of(vehicle));
        when(vehicleRepo.findByPlaka("77AAJ555")).thenReturn(Optional.of(vehicle));
        when(vehicleMapper.toResponse(vehicle)).thenReturn(response);

        VehicleResponse result = vehicleService.updateVehicle(request, 1L);

        assertThat(result).isEqualTo(response);
        verify(vehicleMapper).updateEntityFromRequest(request, vehicle);
    }

    @Test
    void deleteVehicle_kayitYoksa_exceptionFirlarSilmez() {
        when(vehicleRepo.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> vehicleService.deleteVehicle(99L))
                .isInstanceOf(VehicleNotFoundException.class);

        verify(vehicleRepo, never()).deleteById(any());
    }

    @Test
    void deleteVehicle_kayitVarsa_siler() {
        when(vehicleRepo.existsById(1L)).thenReturn(true);

        vehicleService.deleteVehicle(1L);

        verify(vehicleRepo).deleteById(1L);
    }
}