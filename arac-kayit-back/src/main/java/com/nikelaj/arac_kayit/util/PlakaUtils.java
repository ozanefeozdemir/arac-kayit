package com.nikelaj.arac_kayit.util;

public class PlakaUtils {
    public static String normalize(String plaka) {
        return plaka == null ? null : plaka.replaceAll("\\s+", "").toUpperCase();
    }
}