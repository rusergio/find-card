package com.bank.bank_api.service;

import com.bank.bank_api.dto.AuthResponse;
import com.bank.bank_api.dto.LoginRequest;
import com.bank.bank_api.dto.RegisterRequest;
import com.bank.bank_api.dto.UserResponse;
import com.bank.bank_api.entity.User;
import com.bank.bank_api.exception.InvalidCredentialsException;
import com.bank.bank_api.exception.ResourceNotFoundException;
import com.bank.bank_api.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * 🔐 Regras de autenticação: login (JWT), registo (delegado ao {@link UserService}) e perfil atual.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final UserService userService;

    public AuthService(
            UserRepository userRepository,
            JwtService jwtService,
            PasswordEncoder passwordEncoder,
            UserService userService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.userService = userService;
    }

    /**
     * 🔑 Valida credenciais e devolve JWT.
     * <p>
     * 🛡️ Mesma mensagem de erro para email ou password errados — dificulta descobrir que emails existem.
     */
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        return new AuthResponse(jwtService.generateToken(user));
    }

    /**
     * ✍️ Novo registo de cliente (utilizador + conta inicial).
     */
    public void register(RegisterRequest request) {
        userService.registerClient(request);
    }

    /**
     * 🪪 Constrói o DTO de perfil a partir do email no {@link Authentication} (preenchido pelo filtro JWT).
     */
    public UserResponse getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResourceNotFoundException("User not found");
        }
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole(),
                user.getCreatedAt()
        );
    }
}
