package com.nikelaj.arac_kayit.mapper;

import com.nikelaj.arac_kayit.dto.MaintenanceRecordRequest;
import com.nikelaj.arac_kayit.dto.MaintenanceRecordResponse;
import com.nikelaj.arac_kayit.entity.MaintenanceRecord;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface MaintenanceRecordMapper {
    MaintenanceRecordResponse toResponse(MaintenanceRecord maintenanceRecord);

    @Mapping(target = "id",  ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "vehicle" , ignore = true)
    MaintenanceRecord toEntity(MaintenanceRecordRequest request);

    List<MaintenanceRecordResponse> toResponseList(List<MaintenanceRecord> maintenanceRecord);
}
