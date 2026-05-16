package com.bank.bank_api.config;

import com.bank.bank_api.entity.Role;
import com.bank.bank_api.entity.User;
import com.bank.bank_api.repository.UserRepository;
import com.bank.bank_api.service.AccountService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

/**
 * 🌱 Dados iniciais ao arranque da aplicação (seed).
 * <p>
 * Cria um utilizador ADMIN de demonstração + conta bancária, só se ainda não existir na BD.
 */
@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner init(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AccountService accountService) {
        return args -> {
            String adminEmail = "admin@bank.com";
            if (userRepository.findByEmail(adminEmail).isEmpty()) {
                User admin = User.builder()
                        .firstName("System")
                        .lastName("Administrator")
                        .email(adminEmail)
                        .password(passwordEncoder.encode("admin123"))
                        .role(Role.ADMIN)
                        .createdAt(LocalDateTime.now())
                        .build();
                User saved = userRepository.save(admin);
                accountService.createAccountForUser(saved);
                System.out.println("ADMIN user seeded: " + adminEmail + " (password: admin123) + default bank account");
            }
        };
    }
}
