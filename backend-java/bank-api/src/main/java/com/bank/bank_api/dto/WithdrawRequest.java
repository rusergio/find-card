package com.bank.bank_api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * ➖ Pedido de levantamento (débito) numa conta.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WithdrawRequest {

    @NotNull
    private Long accountId;

    @NotNull
    @Positive
    private BigDecimal amount;
}
