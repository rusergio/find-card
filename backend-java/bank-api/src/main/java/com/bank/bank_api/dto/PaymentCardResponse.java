package com.bank.bank_api.dto;

import java.time.LocalDateTime;

public record PaymentCardResponse(
        Long id,
        String holderName,
        String cardNumberMasked,
        String expiry,
        LocalDateTime createdAt
) {
}
