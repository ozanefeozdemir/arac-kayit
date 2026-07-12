package com.nikelaj.arac_kayit.mapper;

import com.nikelaj.arac_kayit.dto.VehicleRequest;
import com.nikelaj.arac_kayit.dto.VehicleResponse;
import com.nikelaj.arac_kayit.entity.Vehicle;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface VehicleMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "maintenanceRecords", ignore = true)
    @Mapping(target = "contractInfos", ignore = true)
    Vehicle toEntity(VehicleRequest request);

    @Mapping(target = "id", ignore = true)

    @Mapping(target = "maintenanceRecords", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "contractInfos", ignore = true)
    void updateEntityFromRequest(VehicleRequest request, @MappingTarget Vehicle vehicle);


    VehicleResponse toResponse(Vehicle vehicle);
}
