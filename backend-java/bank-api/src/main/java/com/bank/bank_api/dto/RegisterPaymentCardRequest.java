package com.bank.bank_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class RegisterPaymentCardRequest {

    @NotBlank
    @Size(min = 3, max = 120)
    @Pattern(regexp = "^[\\p{L}][\\p{L} .'-]{2,119}$", message = "invalid holder name")
    private String holderName;

    @NotBlank
    @Pattern(regexp = "^\\d{16}$", message = "must be 16 digits")
    private String cardNumber;

    @NotBlank
    @Pattern(regexp = "^(0[1-9]|1[0-2])/\\d{2}$", message = "must be MM/YY")
    private String expiry;

    /** Validado no pedido; nunca é guardado na base de dados. */
    @NotBlank
    @Pattern(regexp = "^\\d{3}$", message = "must be 3 digits")
    private String cvc;
}
