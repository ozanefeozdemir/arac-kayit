package com.nikelaj.arac_kayit.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns(
                        "https://*.vercel.app",
                        "http://localhost:5173",
                        "http://127.0.0.1:5173",
                        "https://*.ngrok-free.app",
                        "https://*.ngrok.app",
                        "https://gloomily-tasting-projector.ngrok-free.dev"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}