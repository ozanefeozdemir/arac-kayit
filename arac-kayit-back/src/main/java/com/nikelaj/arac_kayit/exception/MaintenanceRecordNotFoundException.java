package com.nikelaj.arac_kayit.exception;

import com.sun.tools.javac.Main;

public class MaintenanceRecordNotFoundException extends RuntimeException {
    public MaintenanceRecordNotFoundException(String message) {
        super(message);
    }

    public static MaintenanceRecordNotFoundException byBakimId(Long id) {
        return new MaintenanceRecordNotFoundException("Bakim kaydı bulunamadı. Bakım id: " + id);
    }

    public static MaintenanceRecordNotFoundException byPlaka(String plaka) {
        return new MaintenanceRecordNotFoundException("Araca ait bakim kaydı bulunamadı. Plaka: " + plaka);
    }
}
