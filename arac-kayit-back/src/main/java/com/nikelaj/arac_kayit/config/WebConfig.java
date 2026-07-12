package com.nikelaj.arac_kayit.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
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
                        "https://gloomily-tasting-projector.ngrok-free.dev",
                        "https://arac-kayit-7ub7ew2db-ozanefeozdemirs-projects.vercel.app"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(1800);
    }

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.addAllowedOriginPattern("https://*.vercel.app");
        config.addAllowedOriginPattern("http://localhost:5173");
        config.addAllowedOriginPattern("http://127.0.0.1:5173");
        config.addAllowedOriginPattern("https://*.ngrok-free.app");
        config.addAllowedOriginPattern("https://*.ngrok.app");
        config.addAllowedOriginPattern("https://gloomily-tasting-projector.ngrok-free.dev");
        config.addAllowedOriginPattern("https://arac-kayit-7ub7ew2db-ozanefeozdemirs-projects.vercel.app");
        config.addAllowedHeader("*");
        config.addAllowedMethod("GET");
        config.addAllowedMethod("POST");
        config.addAllowedMethod("PUT");
        config.addAllowedMethod("DELETE");
        config.addAllowedMethod("OPTIONS");
        config.setMaxAge(1800L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}