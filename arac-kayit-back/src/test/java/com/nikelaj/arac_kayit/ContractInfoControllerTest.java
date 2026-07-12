package com.nikelaj.arac_kayit;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.nikelaj.arac_kayit.controller.ContractInfoController;
import com.nikelaj.arac_kayit.dto.ContractInfoRequest;
import com.nikelaj.arac_kayit.dto.ContractInfoResponse;
import com.nikelaj.arac_kayit.exception.ContractNotFoundException;
import com.nikelaj.arac_kayit.exception.VehicleNotFoundException;
import com.nikelaj.arac_kayit.service.ContractInfoService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ContractInfoController.class)
class ContractInfoControllerTest {

    @Autowired private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    @MockitoBean
    private ContractInfoService contractInfoService;

    private ContractInfoRequest validRequest() {
        return new ContractInfoRequest(
                LocalDate.of(2026, 1, 1),
                "ABC Kiralama Ltd. Şti.",
                null, null, null,
                "Ahmet Yılmaz",
                null, null, null, null,
                LocalDate.of(2026, 1, 5),
                1000, 1500, 7,
                new BigDecimal("500.00"),
                null
        );
    }

    private ContractInfoResponse response() {
        return new ContractInfoResponse(
                20L, LocalDate.of(2026, 1, 1), "ABC Kiralama Ltd. Şti.",
                null, null, null, "Ahmet Yılmaz", null, null, null, null,
                LocalDate.of(2026, 1, 5), 1000, 1500, 7,
                new BigDecimal("500.00"), null,
                LocalDate.of(2026, 1, 12), new BigDecimal("3500.00"),
                1L
        );
    }

    @Test
    void getById_kayitVarsa_200Doner() throws Exception {
        when(contractInfoService.findById(20L)).thenReturn(response());

        mockMvc.perform(get("/api/contract/{id}", 20L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.aracKiralayan").value("ABC Kiralama Ltd. Şti."))
                .andExpect(jsonPath("$.odenecekToplamTutar").value(3500.00));
    }

    @Test
    void getById_kayitYoksa_404Doner() throws Exception {
        when(contractInfoService.findById(99L)).thenThrow(ContractNotFoundException.bySozlesmeId(99L));

        mockMvc.perform(get("/api/contract/{id}", 99L))
                .andExpect(status().isNotFound());
    }

    @Test
    void getByPlaka_aracVarsa_listeDoner() throws Exception {
        when(contractInfoService.findAllByPlaka("77AAJ555")).thenReturn(List.of(response()));

        mockMvc.perform(get("/api/contract/plaka/{plaka}", "77AAJ555"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void getByPlaka_aracYoksa_404Doner() throws Exception {
        when(contractInfoService.findAllByPlaka("00XXX00"))
                .thenThrow(VehicleNotFoundException.byPlaka("00XXX00"));

        mockMvc.perform(get("/api/contract/plaka/{plaka}", "00XXX00"))
                .andExpect(status().isNotFound());
    }

    @Test
    void save_gecerliRequest_201Doner() throws Exception {
        when(contractInfoService.saveContractInfo(any(), eq(1L))).thenReturn(response());

        mockMvc.perform(post("/api/contract/vehicle/{vehicleId}", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(20));
    }

    @Test
    void save_bosAracKiralayan_400DonerFieldErrorIcerir() throws Exception {
        ContractInfoRequest invalid = new ContractInfoRequest(
                LocalDate.of(2026, 1, 1),
                "",                                   // aracKiralayan boş
                null, null, null,
                "Ahmet Yılmaz", null, null, null, null,
                LocalDate.of(2026, 1, 5),
                1000, 1500, 7, new BigDecimal("500.00"), null
        );

        mockMvc.perform(post("/api/contract/vehicle/{vehicleId}", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.aracKiralayan").exists());

        verify(contractInfoService, never()).saveContractInfo(any(), any());
    }

    @Test
    void save_donusKmBaslangicKmdenKucukse_400DonerAmaFieldErrorDegilFormatHatasi() throws Exception {
        // Bu, @Valid'den DEĞİL, ContractInfoRequest'in compact constructor'ından geliyor.
        // Jackson, record'u instantiate ederken IllegalArgumentException'a çarpıyor,
        // bu da HttpMessageNotReadableException'a sarılıp 400 dönüyor —
        // ama field-level "errors" map'i YOK, çünkü bu @Valid akışına hiç girmedi.
        String brokenJson = """
                {
                  "sozlesmeTarihi": "2026-01-01",
                  "aracKiralayan": "ABC Kiralama",
                  "yetkiliAdSoyad": "Ahmet Yılmaz",
                  "kiralamaTarihi": "2026-01-05",
                  "baslangicKm": 2000,
                  "donusKm": 1000,
                  "kiraSuresiGun": 7,
                  "kiraBedeliGunlukKdvHaric": 500.00
                }
                """;

        mockMvc.perform(post("/api/contract/vehicle/{vehicleId}", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(brokenJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Geçersiz İstek Formatı"));

        verify(contractInfoService, never()).saveContractInfo(any(), any());
    }

    @Test
    void save_aracYoksa_404Doner() throws Exception {
        when(contractInfoService.saveContractInfo(any(), eq(99L)))
                .thenThrow(VehicleNotFoundException.byId(99L));

        mockMvc.perform(post("/api/contract/vehicle/{vehicleId}", 99L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isNotFound());
    }

    @Test
    void delete_kayitVarsa_204Doner() throws Exception {
        doNothing().when(contractInfoService).deleteById(20L);

        mockMvc.perform(delete("/api/contract/{id}", 20L))
                .andExpect(status().isNoContent());
    }

    @Test
    void delete_kayitYoksa_404Doner() throws Exception {
        doThrow(ContractNotFoundException.bySozlesmeId(99L)).when(contractInfoService).deleteById(99L);

        mockMvc.perform(delete("/api/contract/{id}", 99L))
                .andExpect(status().isNotFound());
    }
}