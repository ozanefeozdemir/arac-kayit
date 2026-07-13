package com.nikelaj.arac_kayit.controller;

import com.nikelaj.arac_kayit.dto.VehicleRequest;
import com.nikelaj.arac_kayit.dto.VehicleResponse;
import com.nikelaj.arac_kayit.entity.VehicleStatus;
import com.nikelaj.arac_kayit.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicle")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    @GetMapping("/{id}")
    public ResponseEntity<VehicleResponse> getVehicleById(@PathVariable Long id){
        return ResponseEntity.ok(vehicleService.findVehicleById(id));
    }

    @GetMapping("/plaka/{plaka}")
    public ResponseEntity<VehicleResponse> getVehicleByPlaka(@PathVariable String plaka){
        return ResponseEntity.ok(vehicleService.findVehicleByPlaka(plaka));
    }

    @PostMapping
    public ResponseEntity<VehicleResponse> saveVehicle(@Valid @RequestBody VehicleRequest vehicleRequest){
        return ResponseEntity.status(HttpStatus.CREATED).body(vehicleService.saveVehicle(vehicleRequest));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VehicleResponse> updateVehicle(@Valid @RequestBody VehicleRequest vehicleRequest,  @PathVariable Long id){
        return ResponseEntity.ok(vehicleService.updateVehicle(vehicleRequest, id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable Long id){
        vehicleService.deleteVehicle(id);
        return ResponseEntity.noContent().build();
    }

    // VehicleController.java — eklenecek endpoint
    @GetMapping
    public ResponseEntity<Page<VehicleResponse>> getVehicles(
            @RequestParam(required = false) String plaka,
            @RequestParam(required = false) Integer modelYili,
            @RequestParam(required = false) VehicleStatus durum,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(vehicleService.searchVehicles(plaka, modelYili, durum, page, size));
    }
}
