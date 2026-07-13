package com.nikelaj.arac_kayit.service;

import com.nikelaj.arac_kayit.dto.MaintenanceRecordRequest;
import com.nikelaj.arac_kayit.dto.MaintenanceRecordResponse;
import com.nikelaj.arac_kayit.entity.MaintenanceRecord;
import com.nikelaj.arac_kayit.entity.Vehicle;
import com.nikelaj.arac_kayit.entity.VehicleStatus;
import com.nikelaj.arac_kayit.exception.MaintenanceRecordNotFoundException;
import com.nikelaj.arac_kayit.exception.VehicleNotFoundException;
import com.nikelaj.arac_kayit.mapper.MaintenanceRecordMapper;
import com.nikelaj.arac_kayit.repo.MaintenanceRecordRepo;
import com.nikelaj.arac_kayit.repo.VehicleRepo;
import com.nikelaj.arac_kayit.util.PlakaUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MaintenanceRecordService {

    private final MaintenanceRecordRepo maintenanceRecordRepo;
    private final VehicleRepo vehicleRepo;
    private final MaintenanceRecordMapper maintenanceRecordMapper;

    @Transactional(readOnly = true)
    public MaintenanceRecordResponse findById(Long id) {
        MaintenanceRecord maintenanceRecord = maintenanceRecordRepo.findById(id)
                .orElseThrow(() -> MaintenanceRecordNotFoundException.byBakimId(id));
        return maintenanceRecordMapper.toResponse(maintenanceRecord);
    }

    @Transactional(readOnly = true)
    public List<MaintenanceRecordResponse> findByPlakaAndDurum(String plaka) {
        String normalized = PlakaUtils.normalize(plaka);
        if(!vehicleRepo.existsByPlaka(normalized))
            throw new VehicleNotFoundException(normalized);
        List<MaintenanceRecord> maintenanceRecord = maintenanceRecordRepo.findByVehicle_Plaka(normalized);
        return maintenanceRecordMapper.toResponseList(maintenanceRecord);
    }
    @Transactional
    public MaintenanceRecordResponse saveMaintenanceRecord(MaintenanceRecordRequest maintenanceRecordRequest, Long vehicleId) {
        Vehicle vehicle = vehicleRepo.findById(vehicleId)
                .orElseThrow(() -> VehicleNotFoundException.byId(vehicleId));
        MaintenanceRecord maintenanceRecord = maintenanceRecordMapper.toEntity(maintenanceRecordRequest);
        vehicle.addMaintenanceRecord(maintenanceRecord);
        return maintenanceRecordMapper.toResponse(maintenanceRecordRepo.save(maintenanceRecord));
    }

    @Transactional
    public void deleteById(Long id) {
        if(!maintenanceRecordRepo.existsById(id))
            throw MaintenanceRecordNotFoundException.byBakimId(id);
        maintenanceRecordRepo.deleteById(id);
    }


}
