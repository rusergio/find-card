package com.bank.bank_api.controller;

import com.bank.bank_api.dto.AuthResponse;
import com.bank.bank_api.dto.LoginRequest;
import com.bank.bank_api.dto.MessageResponse;
import com.bank.bank_api.dto.RegisterRequest;
import com.bank.bank_api.dto.UserResponse;
import com.bank.bank_api.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 🔐 Endpoints públicos e semi-públicos de autenticação.
 * <p>
 * {@code /login} e {@code /register} não precisam de token.
 * {@code /me} exige header {@code Authorization: Bearer &lt;jwt&gt;} (ver {@code SecurityConfig}).
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * 🔑 Devolve um JWT se email + password estiverem corretos.
     * O Angular guarda o token e envia-o nas chamadas seguintes.
     */
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    /**
     * ✍️ Cria utilizador + conta bancária inicial (cliente {@code USER}).
     */
    @PostMapping("/register")
    public MessageResponse register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return new MessageResponse("User registered successfully");
    }

    /**
     * 🪪 Perfil do utilizador autenticado (sem password) — útil para menu/header no Angular.
     */
    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        return authService.getCurrentUser(authentication);
    }
}
