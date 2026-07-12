package com.nikelaj.arac_kayit.repo;

import com.nikelaj.arac_kayit.entity.ContractInfo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ContractInfoRepo extends JpaRepository<ContractInfo, Long> {
    List<ContractInfo> findByVehicleId(Long vehicleId);
    List<ContractInfo> findByVehicle_Plaka(String plaka);
}
