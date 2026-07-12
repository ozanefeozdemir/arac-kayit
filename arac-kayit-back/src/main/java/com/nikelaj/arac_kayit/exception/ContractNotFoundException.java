package com.nikelaj.arac_kayit.exception;

public class ContractNotFoundException extends RuntimeException {
    public ContractNotFoundException(String message) {
        super(message);
    }

    public static ContractNotFoundException byPlaka(String plaka){
        return new ContractNotFoundException("Plakaya ait sözleşme bulunamadı: " + plaka);
    }

    public static ContractNotFoundException bySozlesmeId(Long sozlesmeId){
        return new ContractNotFoundException("Sözleşme kaydı bulunamadı: " + sozlesmeId);
    }
}
