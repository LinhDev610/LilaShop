package com.lila_shop.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.scheduling.annotation.EnableScheduling;
import com.lila_shop.backend.configuration.GhnProperties;

@SpringBootApplication
@EnableScheduling
@EnableFeignClients(basePackages = "com.lila_shop.backend.client")
@EnableConfigurationProperties(GhnProperties.class)
public class BackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}
