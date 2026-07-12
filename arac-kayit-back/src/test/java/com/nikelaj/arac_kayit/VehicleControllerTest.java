package com.nikelaj.arac_kayit;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.nikelaj.arac_kayit.controller.VehicleController;
import com.nikelaj.arac_kayit.dto.VehicleRequest;
import com.nikelaj.arac_kayit.dto.VehicleResponse;
import com.nikelaj.arac_kayit.entity.VehicleStatus;
import com.nikelaj.arac_kayit.exception.DuplicatePlakaException;
import com.nikelaj.arac_kayit.exception.VehicleNotFoundException;
import com.nikelaj.arac_kayit.service.VehicleService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest(VehicleController.class)
class VehicleControllerTest {

    @Autowired private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    @org.springframework.test.context.bean.override.mockito.MockitoBean
    private VehicleService vehicleService;

    private VehicleRequest validRequest() {
        return new VehicleRequest(
                "77 AAJ 555", "FORD", "FOCUS", 2025,
                "1.5 TDCI TITANYUM X PAKET", 0,
                LocalDate.of(2026, 8, 15), LocalDate.of(2026, 8, 15),
                null, null, VehicleStatus.AKTIF
        );
    }

    private VehicleResponse response() {
        return new VehicleResponse(
                1L, "77AAJ555", "FORD", "FOCUS", 2025,
                "1.5 TDCI TITANYUM X PAKET", 0,
                LocalDate.of(2026, 8, 15), LocalDate.of(2026, 8, 15),
                null, null, VehicleStatus.AKTIF, null, null
        );
    }

    @Test
    void getVehicleById_kayitVarsa_200DonerVeJsonDoner() throws Exception {
        when(vehicleService.findVehicleById(1L)).thenReturn(response());

        mockMvc.perform(get("/api/vehicle/{id}", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plaka").value("77AAJ555"))
                .andExpect(jsonPath("$.marka").value("FORD"));
    }

    @Test
    void getVehicleById_kayitYoksa_404ProblemDetailDoner() throws Exception {
        when(vehicleService.findVehicleById(99L))
                .thenThrow(VehicleNotFoundException.byId(99L));

        mockMvc.perform(get("/api/vehicle/{id}", 99L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Araç Bulunamadı"))
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void getVehicleByPlaka_kayitVarsa_200Doner() throws Exception {
        when(vehicleService.findVehicleByPlaka("77AAJ555")).thenReturn(response());

        mockMvc.perform(get("/api/vehicle/plaka/{plaka}", "77AAJ555"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plaka").value("77AAJ555"));
    }

    @Test
    void saveVehicle_gecerliRequest_201Doner() throws Exception {
        when(vehicleService.saveVehicle(any())).thenReturn(response());

        mockMvc.perform(post("/api/vehicle")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.plaka").value("77AAJ555"));

        verify(vehicleService).saveVehicle(any());
    }

    @Test
    void saveVehicle_gecersizPlaka_400DonerVeFieldErrorIcerir() throws Exception {
        VehicleRequest invalid = new VehicleRequest(
                "", "FORD", "FOCUS", 2025,           // plaka boş
                "1.5 TDCI TITANYUM X PAKET", -5,      // km negatif
                LocalDate.of(2026, 8, 15), LocalDate.of(2026, 8, 15),
                null, null, VehicleStatus.AKTIF
        );

        mockMvc.perform(post("/api/vehicle")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Doğrulama Hatası"))
                .andExpect(jsonPath("$.errors.plaka").exists())
                .andExpect(jsonPath("$.errors.km").exists());

        // Validasyon controller'a girmeden Jackson/Bean Validation seviyesinde reddedildi,
        // servise hiç ulaşmamalı
        verify(vehicleService, never()).saveVehicle(any());
    }

    @Test
    void saveVehicle_plakaZatenVarsa_409Doner() throws Exception {
        when(vehicleService.saveVehicle(any()))
                .thenThrow(new DuplicatePlakaException("77AAJ555"));

        mockMvc.perform(post("/api/vehicle")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Plaka Çakışması"));
    }

    @Test
    void updateVehicle_gecerliRequest_200Doner() throws Exception {
        when(vehicleService.updateVehicle(any(), eq(1L))).thenReturn(response());

        mockMvc.perform(put("/api/vehicle/{id}", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plaka").value("77AAJ555"));
    }

    @Test
    void updateVehicle_baskaAracinPlakasiylaCakisirsa_409Doner() throws Exception {
        when(vehicleService.updateVehicle(any(), eq(1L)))
                .thenThrow(new DuplicatePlakaException("77AAJ555"));

        mockMvc.perform(put("/api/vehicle/{id}", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isConflict());
    }

    @Test
    void deleteVehicle_kayitVarsa_204Doner() throws Exception {
        doNothing().when(vehicleService).deleteVehicle(1L);

        mockMvc.perform(delete("/api/vehicle/{id}", 1L))
                .andExpect(status().isNoContent());

        verify(vehicleService).deleteVehicle(1L);
    }

    @Test
    void deleteVehicle_kayitYoksa_404Doner() throws Exception {
        doThrow(VehicleNotFoundException.byId(99L)).when(vehicleService).deleteVehicle(99L);

        mockMvc.perform(delete("/api/vehicle/{id}", 99L))
                .andExpect(status().isNotFound());
    }
}
