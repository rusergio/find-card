package com.bank.bank_api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * ✍️ Corpo JSON do {@code POST /auth/register} (e do {@code POST /users} como ADMIN).
 * <p>
 * Os nomes dos campos estão em inglês para alinhar com o código e com o Angular.
 */
@Getter
@Setter
public class RegisterRequest {

    @NotBlank
    @Size(max = 120)
    private String firstName;

    @NotBlank
    @Size(max = 120)
    private String lastName;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 8, max = 128)
    private String password;
}
