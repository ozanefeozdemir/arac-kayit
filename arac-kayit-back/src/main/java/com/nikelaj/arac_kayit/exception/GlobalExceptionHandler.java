package com.nikelaj.arac_kayit.exception;

import com.nikelaj.arac_kayit.exception.DuplicatePlakaException;
import com.nikelaj.arac_kayit.exception.VehicleNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // --- 404: Kayıt bulunamadı ---
    @ExceptionHandler(VehicleNotFoundException.class)
    public ProblemDetail handleVehicleNotFound(VehicleNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Araç Bulunamadı");
        return problem;
    }

    @ExceptionHandler(ContractNotFoundException.class)
    public ProblemDetail handleContractNotFound(ContractNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Sözleşme Bulunamadı");
        return problem;
    }

    @ExceptionHandler(MaintenanceRecordNotFoundException.class)
    public ProblemDetail handleMaintenanceRecordNotFound(MaintenanceRecordNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Bakım Kaydı Bulunamadı");
        return problem;
    }

    // --- 409: Plaka çakışması ---
    @ExceptionHandler(DuplicatePlakaException.class)
    public ProblemDetail handleDuplicatePlaka(DuplicatePlakaException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setTitle("Plaka Çakışması");
        return problem;
    }

    // --- 400: Bean Validation hataları (@Valid @RequestBody) ---
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request
    ) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                fieldErrors.put(error.getField(), error.getDefaultMessage())
        );

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "Girilen veriler geçersiz."
        );
        problem.setTitle("Doğrulama Hatası");
        problem.setProperty("errors", fieldErrors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(problem);
    }

    // --- 400: Manuel iş kuralı ihlalleri (örn. ContractInfoRequest compact constructor) ---
    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail handleIllegalArgument(IllegalArgumentException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setTitle("Geçersiz İstek");
        return problem;
    }

    // --- 400: Bozuk/okunamayan JSON body ---
    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request
    ) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "İstek gövdesi okunamadı. JSON formatını kontrol edin."
        );
        problem.setTitle("Geçersiz İstek Formatı");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(problem);
    }

    // --- 500: Beklenmeyen her şey (son çare) ---
    @ExceptionHandler(Exception.class)
    public ProblemDetail handleUnexpected(Exception ex, HttpServletRequest request) {
        log.error("Beklenmeyen hata: {} - URI: {}", ex.getMessage(), request.getRequestURI(), ex);

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin."
        );
        problem.setTitle("Sunucu Hatası");
        return problem;
    }
}