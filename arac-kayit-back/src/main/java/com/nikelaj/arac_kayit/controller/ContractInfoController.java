package com.nikelaj.arac_kayit.controller;

import com.nikelaj.arac_kayit.dto.ContractInfoRequest;
import com.nikelaj.arac_kayit.dto.ContractInfoResponse;
import com.nikelaj.arac_kayit.service.ContractInfoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
@RequestMapping("api/contract")
@RequiredArgsConstructor
public class ContractInfoController {
    private final ContractInfoService contractInfoService;

    @GetMapping("/{id}")
    public ResponseEntity<ContractInfoResponse>  getContractInfoById(@PathVariable Long id){
        return ResponseEntity.ok(contractInfoService.findById(id));
    }

    @GetMapping("plaka/{plaka}")
    public ResponseEntity<List<ContractInfoResponse>> getContractInfoByPlaka(@PathVariable String plaka){
        return ResponseEntity.ok(contractInfoService.findAllByPlaka(plaka));
    }

    @PostMapping("vehicle/{vehicleId}")
    public ResponseEntity<ContractInfoResponse> saveContractInfo(@PathVariable Long vehicleId, @Valid @RequestBody ContractInfoRequest contractInfoRequest){
        return ResponseEntity.status(HttpStatus.CREATED).body(contractInfoService.saveContractInfo(contractInfoRequest, vehicleId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContractInfo(@PathVariable Long id){
        contractInfoService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
