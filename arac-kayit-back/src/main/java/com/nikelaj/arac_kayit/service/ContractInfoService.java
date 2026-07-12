package com.nikelaj.arac_kayit.service;


import com.nikelaj.arac_kayit.dto.ContractInfoRequest;
import com.nikelaj.arac_kayit.dto.ContractInfoResponse;
import com.nikelaj.arac_kayit.entity.ContractInfo;
import com.nikelaj.arac_kayit.entity.Vehicle;
import com.nikelaj.arac_kayit.exception.ContractNotFoundException;
import com.nikelaj.arac_kayit.exception.DuplicatePlakaException;
import com.nikelaj.arac_kayit.exception.VehicleNotFoundException;
import com.nikelaj.arac_kayit.mapper.ContractInfoMapper;
import com.nikelaj.arac_kayit.repo.ContractInfoRepo;
import com.nikelaj.arac_kayit.repo.VehicleRepo;
import com.nikelaj.arac_kayit.util.PlakaUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ContractInfoService {

    private final ContractInfoRepo contractInfoRepo;
    private final ContractInfoMapper contractInfoMapper;
    private final VehicleService vehicleService;
    private final VehicleRepo vehicleRepo;

    @Transactional(readOnly = true)
    public List<ContractInfoResponse> findAllByPlaka(String plaka){
        String normalized = PlakaUtils.normalize(plaka);
        if(!vehicleRepo.existsByPlaka(normalized))
            throw new VehicleNotFoundException(normalized);
        List<ContractInfo> contracts = contractInfoRepo.findByVehicle_Plaka(normalized);
        return contractInfoMapper.toResponseList(contracts);
    }

    @Transactional(readOnly = true)
    public ContractInfoResponse findById(Long id){
        ContractInfo contractInfo = contractInfoRepo.findById(id)
                .orElseThrow(() -> ContractNotFoundException.bySozlesmeId(id));
        return contractInfoMapper.toResponse(contractInfo);
    }

    @Transactional
    public ContractInfoResponse saveContractInfo(ContractInfoRequest contractInfoRequest, Long vehicleId){
        Vehicle vehicle = vehicleRepo.findById(vehicleId)
                .orElseThrow(() -> VehicleNotFoundException.byId(vehicleId));
        ContractInfo contract = contractInfoMapper.toEntity(contractInfoRequest);
        vehicle.addContractInfo(contract);
        return  contractInfoMapper.toResponse(contractInfoRepo.save(contract));
    }

    @Transactional
    public void deleteById(Long id){
        if(contractInfoRepo.existsById(id))
            contractInfoRepo.deleteById(id);
        else throw ContractNotFoundException.bySozlesmeId(id);
    }

}
