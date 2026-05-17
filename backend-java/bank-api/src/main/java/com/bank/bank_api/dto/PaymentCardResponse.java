package com.bank.bank_api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentCardResponse(
        Long id,
        String holderName,
        String cardNumberMasked,
        String expiry,
        BigDecimal balance,
        String currency,
        LocalDateTime createdAt
) {
}
