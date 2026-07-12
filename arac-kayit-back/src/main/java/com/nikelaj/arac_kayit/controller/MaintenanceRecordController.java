package com.nikelaj.arac_kayit.controller;

import com.nikelaj.arac_kayit.dto.MaintenanceRecordRequest;
import com.nikelaj.arac_kayit.dto.MaintenanceRecordResponse;
import com.nikelaj.arac_kayit.service.MaintenanceRecordService;
import jakarta.validation.Valid;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/maintenance")
@RequiredArgsConstructor
public class MaintenanceRecordController {

    private final MaintenanceRecordService maintenanceRecordService;

    @GetMapping("/plaka/{plaka}")
    public ResponseEntity<List<MaintenanceRecordResponse>> getMaintenanceRecordByVehicleId(@PathVariable String plaka){
        return ResponseEntity.ok(maintenanceRecordService.findByPlaka(plaka));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MaintenanceRecordResponse> getMaintenanceRecordById(@PathVariable Long id){
        return ResponseEntity.ok(maintenanceRecordService.findById(id));
    }

    @PostMapping("/vehicle/{vehicleId}")
    public ResponseEntity<MaintenanceRecordResponse> saveMaintenanceRecord(@PathVariable Long vehicleId, @Valid @RequestBody MaintenanceRecordRequest request){
        return ResponseEntity.status(HttpStatus.CREATED).body(maintenanceRecordService.saveMaintenanceRecord(request, vehicleId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMaintenanceRecordById(@PathVariable Long id){
        maintenanceRecordService.deleteById(id);
        return ResponseEntity.noContent().build();
    }



}
