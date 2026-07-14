package com.nikelaj.arac_kayit.repo;

import com.nikelaj.arac_kayit.entity.Vehicle;
import com.nikelaj.arac_kayit.entity.VehicleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VehicleRepo extends JpaRepository<Vehicle, Long>, JpaSpecificationExecutor<Vehicle> {

    Optional<Vehicle> findFirstByPlakaAndDurum(String plaka, VehicleStatus durum);
    boolean existsByPlakaAndDurum(String plaka,  VehicleStatus durum);
    boolean existsByPlaka(String plaka);
    List<Vehicle> findByDurum(VehicleStatus durum);

    @Query("SELECT DISTINCT v.marka FROM Vehicle v ORDER BY v.marka")
    List<String> findDistinctMarkalar();

    @Query("SELECT DISTINCT v.model FROM Vehicle v WHERE v.marka = :marka ORDER BY v.model")
    List<String> findDistinctModellerByMarka(@Param("marka") String marka);

}
