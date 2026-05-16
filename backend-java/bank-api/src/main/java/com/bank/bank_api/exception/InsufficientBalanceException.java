package com.bank.bank_api.exception;

/** 💸 Saldo insuficiente para completar a operação. */
public class InsufficientBalanceException extends RuntimeException {
    public InsufficientBalanceException(String message) {
        super(message);
    }
}
