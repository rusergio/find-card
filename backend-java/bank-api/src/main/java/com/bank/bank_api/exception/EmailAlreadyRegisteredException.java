package com.bank.bank_api.exception;

/** 📧 Email já usado no registo. */
public class EmailAlreadyRegisteredException extends RuntimeException {
    public EmailAlreadyRegisteredException(String message) {
        super(message);
    }
}
