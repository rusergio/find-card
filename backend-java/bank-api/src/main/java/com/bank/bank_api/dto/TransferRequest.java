package com.bank.bank_api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;


// 🔁 Pedido de transferência entre duas contas (origem e destino).

@Getter
@Setter
@NoArgsConstructor
public class TransferRequest {

    @NotNull
    private Long fromAccountId;

    @NotNull
    private Long toAccountId;

    @NotNull
    @Positive
    private BigDecimal amount;
}
