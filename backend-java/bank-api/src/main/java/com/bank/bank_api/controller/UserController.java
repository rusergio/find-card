package com.bank.bank_api.controller;

import com.bank.bank_api.dto.MessageResponse;
import com.bank.bank_api.dto.RegisterRequest;
import com.bank.bank_api.service.UserService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 👥 Gestão de utilizadores (uso restrito).
 * <p>
 * O registo “normal” do cliente é o {@code POST /auth/register}.
 * Este endpoint duplica o fluxo mas <strong>só para ADMIN</strong> (testes ou backoffice simples).
 */
@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * 🛡️ Cria cliente + conta — mesmo corpo que {@code /auth/register}, mas exige role {@code ADMIN}.
     */
    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping
    public MessageResponse createUser(@Valid @RequestBody RegisterRequest request) {
        userService.registerClient(request);
        return new MessageResponse("User created successfully");
    }
}
