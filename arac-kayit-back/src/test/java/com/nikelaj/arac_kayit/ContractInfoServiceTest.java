package com.nikelaj.arac_kayit;


import com.nikelaj.arac_kayit.dto.ContractInfoRequest;
import com.nikelaj.arac_kayit.dto.ContractInfoResponse;
import com.nikelaj.arac_kayit.entity.ContractInfo;
import com.nikelaj.arac_kayit.entity.Vehicle;
import com.nikelaj.arac_kayit.exception.ContractNotFoundException;
import com.nikelaj.arac_kayit.exception.VehicleNotFoundException;
import com.nikelaj.arac_kayit.mapper.ContractInfoMapper;
import com.nikelaj.arac_kayit.repo.ContractInfoRepo;
import com.nikelaj.arac_kayit.repo.VehicleRepo;
import com.nikelaj.arac_kayit.service.ContractInfoService;
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
class ContractInfoServiceTest {

    @Mock private ContractInfoRepo contractInfoRepo;
    @Mock private VehicleRepo vehicleRepo;
    @Mock private ContractInfoMapper contractInfoMapper;

    @InjectMocks
    private ContractInfoService contractInfoService;

    private Vehicle vehicle;
    private ContractInfo contractInfo;
    private ContractInfoRequest request;
    private ContractInfoResponse response;

    @BeforeEach
    void setUp() {
        vehicle = new Vehicle();
        vehicle.setId(1L);
        vehicle.setPlaka("77AAJ555");

        contractInfo = new ContractInfo();
        contractInfo.setId(20L);
        contractInfo.setSozlesmeTarihi(LocalDate.of(2026, 1, 1));
        contractInfo.setAracKiralayan("ABC Kiralama Ltd. Şti.");
        contractInfo.setYetkiliAdSoyad("Ahmet Yılmaz");
        contractInfo.setKiralamaTarihi(LocalDate.of(2026, 1, 5));
        contractInfo.setBaslangicKm(1000);
        contractInfo.setDonusKm(1500);
        contractInfo.setKiraSuresiGun(7);
        contractInfo.setKiraBedeliGunlukKdvHaric(new BigDecimal("500.00"));

        request = new ContractInfoRequest(
                LocalDate.of(2026, 1, 1),
                "ABC Kiralama Ltd. Şti.",
                null,
                null,
                null,
                "Ahmet Yılmaz",
                null,
                null,
                null,
                null,
                LocalDate.of(2026, 1, 5),
                1000,
                1500,
                7,
                new BigDecimal("500.00"),
                null
        );

        response = new ContractInfoResponse(
                20L,
                LocalDate.of(2026, 1, 1),
                "ABC Kiralama Ltd. Şti.",
                null, null, null,
                "Ahmet Yılmaz",
                null, null, null, null,
                LocalDate.of(2026, 1, 5),
                1000, 1500, 7,
                new BigDecimal("500.00"),
                null,
                LocalDate.of(2026, 1, 12),
                new BigDecimal("3500.00"),
                1L
        );
    }

    @Test
    void findAllByPlaka_aracYoksa_exceptionFirlar() {
        when(vehicleRepo.existsByPlaka("77AAJ555")).thenReturn(false);

        assertThatThrownBy(() -> contractInfoService.findAllByPlaka("77 aaj 555"))
                .isInstanceOf(VehicleNotFoundException.class);

        verify(contractInfoRepo, never()).findByVehicle_Plaka(any());
    }

    @Test
    void findAllByPlaka_aracVarsa_normalizeEdilerekListelenir() {
        when(vehicleRepo.existsByPlaka("77AAJ555")).thenReturn(true);
        when(contractInfoRepo.findByVehicle_Plaka("77AAJ555"))
                .thenReturn(List.of(contractInfo));
        when(contractInfoMapper.toResponseList(List.of(contractInfo)))
                .thenReturn(List.of(response));

        List<ContractInfoResponse> result = contractInfoService.findAllByPlaka("77 aaj 555");

        assertThat(result).hasSize(1);
        verify(contractInfoRepo).findByVehicle_Plaka("77AAJ555");
    }

    @Test
    void findById_kayitVarsa_responseDoner() {
        when(contractInfoRepo.findById(20L)).thenReturn(Optional.of(contractInfo));
        when(contractInfoMapper.toResponse(contractInfo)).thenReturn(response);

        ContractInfoResponse result = contractInfoService.findById(20L);

        assertThat(result.aracKiralayan()).isEqualTo("ABC Kiralama Ltd. Şti.");
    }

    @Test
    void findById_kayitYoksa_exceptionFirlar() {
        when(contractInfoRepo.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> contractInfoService.findById(99L))
                .isInstanceOf(ContractNotFoundException.class);

        verify(contractInfoMapper, never()).toResponse(any());
    }

    @Test
    void saveContractInfo_aracYoksa_exceptionFirlarKaydetmez() {
        when(vehicleRepo.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> contractInfoService.saveContractInfo(request, 1L))
                .isInstanceOf(VehicleNotFoundException.class);

        verify(contractInfoRepo, never()).save(any());
    }

    @Test
    void saveContractInfo_gecerliyse_araciBaglarVeKaydeder() {
        when(vehicleRepo.findById(1L)).thenReturn(Optional.of(vehicle));
        when(contractInfoMapper.toEntity(request)).thenReturn(contractInfo);
        when(contractInfoRepo.save(contractInfo)).thenReturn(contractInfo);
        when(contractInfoMapper.toResponse(contractInfo)).thenReturn(response);

        ContractInfoResponse result = contractInfoService.saveContractInfo(request, 1L);

        assertThat(result).isEqualTo(response);
        assertThat(vehicle.getContractInfos()).contains(contractInfo);
        assertThat(contractInfo.getVehicle()).isEqualTo(vehicle);
        verify(contractInfoRepo).save(contractInfo);
    }

    @Test
    void deleteById_kayitYoksa_exceptionFirlarSilmez() {
        when(contractInfoRepo.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> contractInfoService.deleteById(99L))
                .isInstanceOf(ContractNotFoundException.class);

        verify(contractInfoRepo, never()).deleteById(any());
    }

    @Test
    void deleteById_kayitVarsa_siler() {
        when(contractInfoRepo.existsById(20L)).thenReturn(true);

        contractInfoService.deleteById(20L);

        verify(contractInfoRepo).deleteById(20L);
    }
}