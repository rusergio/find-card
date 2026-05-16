package com.bank.bank_api.exception;

/** 🔑 Login falhou (mensagem genérica no serviço para não revelar se o email existe). */
public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException(String message) {
        super(message);
    }
}
