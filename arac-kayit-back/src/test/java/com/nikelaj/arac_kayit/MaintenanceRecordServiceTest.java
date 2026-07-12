package com.nikelaj.arac_kayit;


import com.nikelaj.arac_kayit.dto.MaintenanceRecordRequest;
import com.nikelaj.arac_kayit.dto.MaintenanceRecordResponse;
import com.nikelaj.arac_kayit.entity.MaintenanceRecord;
import com.nikelaj.arac_kayit.entity.Vehicle;
import com.nikelaj.arac_kayit.exception.MaintenanceRecordNotFoundException;
import com.nikelaj.arac_kayit.exception.VehicleNotFoundException;
import com.nikelaj.arac_kayit.mapper.MaintenanceRecordMapper;
import com.nikelaj.arac_kayit.repo.MaintenanceRecordRepo;
import com.nikelaj.arac_kayit.repo.VehicleRepo;
import com.nikelaj.arac_kayit.service.MaintenanceRecordService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MaintenanceRecordServiceTest {

    @Mock private MaintenanceRecordRepo maintenanceRecordRepo;
    @Mock private VehicleRepo vehicleRepo;
    @Mock private MaintenanceRecordMapper maintenanceRecordMapper;

    @InjectMocks
    private MaintenanceRecordService maintenanceRecordService;

    private Vehicle vehicle;
    private MaintenanceRecord maintenanceRecord;
    private MaintenanceRecordRequest request;
    private MaintenanceRecordResponse response;

    @BeforeEach
    void setUp() {
        vehicle = new Vehicle();
        vehicle.setId(1L);
        vehicle.setPlaka("77AAJ555");

        maintenanceRecord = new MaintenanceRecord();
        maintenanceRecord.setId(10L);
        maintenanceRecord.setBakimTarihi(LocalDate.of(2026, 3, 15));
        maintenanceRecord.setYapilanIslemler("Yağ değişimi, filtre değişimi");
        maintenanceRecord.setMaliyet(new BigDecimal("1500.00"));

        request = new MaintenanceRecordRequest(
                LocalDate.of(2026, 3, 15),
                "Yağ değişimi, filtre değişimi",
                new BigDecimal("1500.00")
        );

        response = new MaintenanceRecordResponse(
                10L,
                LocalDate.of(2026, 3, 15),
                "Yağ değişimi, filtre değişimi",
                new BigDecimal("1500.00")
        );
    }

    @Test
    void findById_kayitVarsa_responseDoner() {
        when(maintenanceRecordRepo.findById(10L)).thenReturn(Optional.of(maintenanceRecord));
        when(maintenanceRecordMapper.toResponse(maintenanceRecord)).thenReturn(response);

        MaintenanceRecordResponse result = maintenanceRecordService.findById(10L);

        assertThat(result.yapilanIslemler()).isEqualTo("Yağ değişimi, filtre değişimi");
        verify(maintenanceRecordRepo).findById(10L);
    }

    @Test
    void findById_kayitYoksa_exceptionFirlar() {
        when(maintenanceRecordRepo.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> maintenanceRecordService.findById(99L))
                .isInstanceOf(MaintenanceRecordNotFoundException.class)
                .hasMessageContaining("99");

        verify(maintenanceRecordMapper, never()).toResponse(any());
    }

    @Test
    void findByPlaka_aracYoksa_exceptionFirlarBakimSorgulanmaz() {
        when(vehicleRepo.existsByPlaka("77AAJ555")).thenReturn(false);

        assertThatThrownBy(() -> maintenanceRecordService.findByPlaka("77 aaj 555"))
                .isInstanceOf(VehicleNotFoundException.class);

        verify(maintenanceRecordRepo, never()).findByVehicle_Plaka(any());
    }

    @Test
    void findByPlaka_bosluklu_kucukHarfliPlaka_normalizeEdilerekAranir() {
        when(vehicleRepo.existsByPlaka("77AAJ555")).thenReturn(true);
        when(maintenanceRecordRepo.findByVehicle_Plaka("77AAJ555"))
                .thenReturn(List.of(maintenanceRecord));
        when(maintenanceRecordMapper.toResponseList(List.of(maintenanceRecord)))
                .thenReturn(List.of(response));

        List<MaintenanceRecordResponse> result = maintenanceRecordService.findByPlaka("77 aaj 555");

        assertThat(result).hasSize(1);
        verify(maintenanceRecordRepo).findByVehicle_Plaka("77AAJ555");
    }

    @Test
    void saveMaintenanceRecord_aracYoksa_exceptionFirlarKaydetmez() {
        when(vehicleRepo.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> maintenanceRecordService.saveMaintenanceRecord(request, 1L))
                .isInstanceOf(VehicleNotFoundException.class);

        verify(maintenanceRecordRepo, never()).save(any());
    }

    @Test
    void saveMaintenanceRecord_aracVarsa_kaydiAracaBaglarVeKaydeder() {
        when(vehicleRepo.findById(1L)).thenReturn(Optional.of(vehicle));
        when(maintenanceRecordMapper.toEntity(request)).thenReturn(maintenanceRecord);
        when(maintenanceRecordRepo.save(maintenanceRecord)).thenReturn(maintenanceRecord);
        when(maintenanceRecordMapper.toResponse(maintenanceRecord)).thenReturn(response);

        MaintenanceRecordResponse result = maintenanceRecordService.saveMaintenanceRecord(request, 1L);

        assertThat(result).isEqualTo(response);
        assertThat(vehicle.getMaintenanceRecords()).contains(maintenanceRecord);
        assertThat(maintenanceRecord.getVehicle()).isEqualTo(vehicle);
        verify(maintenanceRecordRepo).save(maintenanceRecord);
    }

    @Test
    void deleteById_kayitYoksa_exceptionFirlarSilmez() {
        when(maintenanceRecordRepo.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> maintenanceRecordService.deleteById(99L))
                .isInstanceOf(MaintenanceRecordNotFoundException.class);

        verify(maintenanceRecordRepo, never()).deleteById(any());
    }

    @Test
    void deleteById_kayitVarsa_siler() {
        when(maintenanceRecordRepo.existsById(10L)).thenReturn(true);

        maintenanceRecordService.deleteById(10L);

        verify(maintenanceRecordRepo).deleteById(10L);
    }
}