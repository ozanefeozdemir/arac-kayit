package com.nikelaj.arac_kayit.exception;

public class DuplicatePlakaException extends RuntimeException {
    public DuplicatePlakaException(String plaka) {
        super(
                "Bu plakada araç kaydı var: " + plaka
        );
    }
}
