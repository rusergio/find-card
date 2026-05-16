package com.bank.bank_api.service;

import com.bank.bank_api.dto.RegisterRequest;
import com.bank.bank_api.entity.Role;
import com.bank.bank_api.entity.User;
import com.bank.bank_api.exception.EmailAlreadyRegisteredException;
import com.bank.bank_api.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 👤 Criação e persistência de utilizadores (lado “domínio” do registo).
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final AccountService accountService;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            AccountService accountService,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.accountService = accountService;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * ✍️ Registo de cliente: grava {@code USER}, password com BCrypt, e abre conta em EUR com saldo zero.
     * <p>
     * 📧 Email normalizado (trim + minúsculas) para evitar duplicados “quase iguais”.
     */
    @Transactional
    public User registerClient(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyRegisteredException("Email already registered");
        }

        User user = User.builder()
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .createdAt(LocalDateTime.now())
                .build();

        User saved = userRepository.save(user);
        accountService.createAccountForUser(saved);
        return saved;
    }
}
