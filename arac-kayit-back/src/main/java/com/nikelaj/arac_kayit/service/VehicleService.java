package com.nikelaj.arac_kayit.service;

import com.nikelaj.arac_kayit.dto.VehicleRequest;
import com.nikelaj.arac_kayit.dto.VehicleResponse;
import com.nikelaj.arac_kayit.entity.VehicleSpecifications;
import com.nikelaj.arac_kayit.entity.VehicleStatus;
import com.nikelaj.arac_kayit.exception.DuplicatePlakaException;
import com.nikelaj.arac_kayit.exception.VehicleNotFoundException;
import com.nikelaj.arac_kayit.util.PlakaUtils;
import com.nikelaj.arac_kayit.entity.Vehicle;
import com.nikelaj.arac_kayit.mapper.VehicleMapper;
import com.nikelaj.arac_kayit.repo.ContractInfoRepo;
import com.nikelaj.arac_kayit.repo.MaintenanceRecordRepo;
import com.nikelaj.arac_kayit.repo.VehicleRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepo vehicleRepo;
    private final MaintenanceRecordRepo maintenanceRecordRepo;
    private final ContractInfoRepo contractInfoRepo;
    private final VehicleMapper vehicleMapper;

    @Transactional(readOnly = true)
    public VehicleResponse findVehicleById(Long id) {
        return vehicleMapper.toResponse(vehicleRepo.findById(id)
                .orElseThrow(() -> VehicleNotFoundException.byId(id))
        );
    }

    @Transactional(readOnly = true)
    public VehicleResponse findVehicleByPlaka(String plaka) {
        String normalized = PlakaUtils.normalize(plaka);
        return vehicleMapper.toResponse(
                vehicleRepo.findFirstByPlakaAndDurum(PlakaUtils.normalize(normalized), VehicleStatus.AKTIF)
                        .orElseThrow(() -> VehicleNotFoundException.byPlaka(normalized))
        );
    }

    @Transactional
    public VehicleResponse saveVehicle(VehicleRequest vehicleRequest) throws DuplicatePlakaException {
        if(vehicleRepo.existsByPlakaAndDurum(PlakaUtils.normalize(vehicleRequest.plaka()),  VehicleStatus.AKTIF))
            throw new DuplicatePlakaException(vehicleRequest.plaka());
        Vehicle vehicle = vehicleMapper.toEntity(vehicleRequest);
        return vehicleMapper.toResponse(vehicleRepo.save(vehicle));
    }

    @Transactional
    public VehicleResponse updateVehicle(VehicleRequest vehicleRequest, Long vehicleId) {
        Vehicle vehicle = vehicleRepo.findById(vehicleId)
                .orElseThrow(() -> VehicleNotFoundException.byId(vehicleId));
        String normalized = PlakaUtils.normalize(vehicleRequest.plaka());
        vehicleRepo.findFirstByPlakaAndDurum(normalized, VehicleStatus.AKTIF)
                .filter(existing -> !existing.getId().equals(vehicleId))
                .ifPresent(existing -> { throw new DuplicatePlakaException(normalized); });
        vehicleMapper.updateEntityFromRequest(vehicleRequest, vehicle);
        return vehicleMapper.toResponse(vehicle);
    }

    @Transactional
    public void deleteVehicle(Long vehicleId) throws VehicleNotFoundException {
        if(!vehicleRepo.existsById(vehicleId))
            throw VehicleNotFoundException.byId(vehicleId);
        vehicleRepo.deleteById(vehicleId);
    }

    // VehicleService.java — eklenecek metod
    @Transactional(readOnly = true)
    public Page<VehicleResponse> searchVehicles(String plaka, Integer modelYili, VehicleStatus durum, int page, int size) {
        Specification<Vehicle> spec = Specification
                .where(VehicleSpecifications.hasPlaka(plaka))
                .and(VehicleSpecifications.hasModelYili(modelYili))
                .and(VehicleSpecifications.hasDurum(durum));

        // ID'ye göre azalan sıralama (En son eklenen en üstte)
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));

        return vehicleRepo.findAll(spec, pageable).map(vehicleMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public List<String> getMarkalar() {
        return vehicleRepo.findDistinctMarkalar();
    }

    @Transactional(readOnly = true)
    public List<String> getModeller(String marka) {
        if (marka == null || marka.isBlank()) {
            return List.of();
        }
        return vehicleRepo.findDistinctModellerByMarka(marka.trim());
    }

}
