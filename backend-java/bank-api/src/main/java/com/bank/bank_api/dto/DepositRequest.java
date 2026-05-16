package com.bank.bank_api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * ➕ Pedido de depósito: em qual conta e que valor creditar.
 */
@Getter
@Setter
@NoArgsConstructor
public class DepositRequest {

    @NotNull
    private Long accountId;

    @NotNull
    @Positive
    private BigDecimal amount;
}
