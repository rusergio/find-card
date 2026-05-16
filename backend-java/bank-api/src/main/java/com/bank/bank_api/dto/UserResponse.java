package com.bank.bank_api.dto;

import com.bank.bank_api.entity.Role;

import java.time.LocalDateTime;

/**
 * 🪪 Perfil do utilizador autenticado para o Angular (sem password).
 * <p>
 * O campo {@code role} serializa como string JSON, ex.: {@code "USER"}.
 */
public record UserResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        Role role,
        LocalDateTime createdAt
) {
}
