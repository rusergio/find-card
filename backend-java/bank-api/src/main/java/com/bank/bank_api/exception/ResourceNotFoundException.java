package com.bank.bank_api.exception;

/** 🔍 Recurso pedido não existe (ou não podes saber se existe — ex.: conta de outro utilizador). */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
