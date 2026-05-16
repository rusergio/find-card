package com.bank.bank_api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 🚀 Ponto de entrada da aplicação Spring Boot.
 * <p>
 * Ao arrancar, o Spring descobre controladores, serviços, segurança JPA, etc.
 * O perfil ativo (ex.: {@code dev}) pode ser definido por variável de ambiente ou {@code application.properties}.
 */
@SpringBootApplication
public class BankApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(BankApiApplication.class, args);
    }
}
