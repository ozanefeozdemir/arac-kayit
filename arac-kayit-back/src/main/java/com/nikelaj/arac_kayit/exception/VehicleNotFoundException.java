package com.nikelaj.arac_kayit.exception;

public class VehicleNotFoundException extends RuntimeException {
    public VehicleNotFoundException(String message) {
        super(message);
    }

    public static VehicleNotFoundException byId(Long id) {
        return new VehicleNotFoundException("Araç bulunamadı. Araç id: " + id);
    }

    public static VehicleNotFoundException byPlaka(String plaka) {
        return new VehicleNotFoundException("Araç bulunamadı. Plaka: " + plaka);
    }
}