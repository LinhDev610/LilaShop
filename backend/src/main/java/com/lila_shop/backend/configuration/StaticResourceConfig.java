package com.lila_shop.backend.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuration for static resources.
 * Only handles assets folder - media files are now stored on Cloudinary.
 */
@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {
        @Override
        public void addResourceHandlers(ResourceHandlerRegistry registry) {
                // Handle assets folder (static resources như images, css, js)
                registry.addResourceHandler("/assets/**")
                                .addResourceLocations("classpath:/static/assets/", "file:assets/");
        }
}
