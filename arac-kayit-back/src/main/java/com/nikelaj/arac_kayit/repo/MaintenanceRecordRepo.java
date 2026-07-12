package com.nikelaj.arac_kayit.repo;

import com.nikelaj.arac_kayit.entity.MaintenanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaintenanceRecordRepo extends JpaRepository<MaintenanceRecord, Long> {
    List<MaintenanceRecord> findByVehicleIdOrderByBakimTarihiDesc(Long vehicleId);
    List<MaintenanceRecord> findByVehicle_Plaka(String plaka);
}
