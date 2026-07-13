package com.nikelaj.arac_kayit.repo;

import com.nikelaj.arac_kayit.entity.Vehicle;
import com.nikelaj.arac_kayit.entity.VehicleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface VehicleRepo extends JpaRepository<Vehicle, Long>, JpaSpecificationExecutor<Vehicle> {

    Optional<Vehicle> findFirstByPlakaAndDurum(String plaka, VehicleStatus durum);
    boolean existsByPlakaAndDurum(String plaka,  VehicleStatus durum);
    boolean existsByPlaka(String plaka);
    List<Vehicle> findByDurum(VehicleStatus durum);

}
