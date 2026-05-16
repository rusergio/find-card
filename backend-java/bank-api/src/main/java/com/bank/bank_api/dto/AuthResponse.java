package com.bank.bank_api.dto;

/**
 * 🎫 Resposta de login: o cliente envia isto no header {@code Authorization: Bearer ...}.
 */
public record AuthResponse(String token) {
}
