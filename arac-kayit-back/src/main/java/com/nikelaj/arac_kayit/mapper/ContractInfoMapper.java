package com.nikelaj.arac_kayit.mapper;

import com.nikelaj.arac_kayit.dto.ContractInfoRequest;
import com.nikelaj.arac_kayit.dto.ContractInfoResponse;
import com.nikelaj.arac_kayit.entity.ContractInfo;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ContractInfoMapper {

    @Mapping(target = "vehicleId", source = "vehicle.id")
    ContractInfoResponse toResponse(ContractInfo contract);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "vehicle", ignore = true)
    @Mapping(target = "donusTarihi", ignore = true)
    @Mapping(target = "odenecekToplamTutar", ignore = true)
    ContractInfo toEntity(ContractInfoRequest request);

    List<ContractInfoResponse> toResponseList(List<ContractInfo> contractInfoList);
}