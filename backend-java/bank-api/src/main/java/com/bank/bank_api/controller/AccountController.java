package com.bank.bank_api.controller;

import com.bank.bank_api.dto.DepositRequest;
import com.bank.bank_api.dto.MessageResponse;
import com.bank.bank_api.dto.TransferRequest;
import com.bank.bank_api.dto.WithdrawRequest;
import com.bank.bank_api.entity.Account;
import com.bank.bank_api.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 💳 API REST das contas bancárias (saldo, depósito, levantamento, transferência).
 * <p>
 * Regra importante: um {@code USER} só opera nas <strong>suas</strong> contas; um {@code ADMIN}
 * pode ver/operar em todas (útil em desenvolvimento). A lógica está no {@link AccountService}.
 */
@RestController
@RequestMapping("/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    /**
     * 📋 Lista contas: todas se fores ADMIN, só as tuas se fores USER.
     */
    @GetMapping
    public List<Account> getAllAccounts(Authentication authentication) {
        return accountService.listAccountsForCaller(authentication);
    }

    /**
     * 🔍 Detalhe de uma conta (se tiveres permissão para a ver).
     */
    @GetMapping("/{id}")
    public Account getAccountById(@PathVariable Long id, Authentication authentication) {
        return accountService.getAccountForCaller(id, authentication);
    }

    /**
     * ➕ Credita saldo na conta (validação + registo de transação {@code DEPOSIT}).
     */
    @PostMapping("/deposit")
    public Account deposit(@Valid @RequestBody DepositRequest request, Authentication authentication) {
        return accountService.deposit(
                request.getAccountId(),
                request.getAmount(),
                authentication
        );
    }

    /**
     * 🔁 Move valor entre duas contas (origem deve ser tua, salvo ADMIN).
     */
    @PostMapping("/transfer")
    public MessageResponse transfer(@Valid @RequestBody TransferRequest request, Authentication authentication) {
        accountService.transfer(
                request.getFromAccountId(),
                request.getToAccountId(),
                request.getAmount(),
                authentication
        );
        return new MessageResponse("Transfer successful");
    }

    /**
     * ➖ Debita saldo (levantamento) com registo {@code WITHDRAW}.
     */
    @PostMapping("/withdraw")
    public Account withdraw(@Valid @RequestBody WithdrawRequest request, Authentication authentication) {
        return accountService.withdraw(
                request.getAccountId(),
                request.getAmount(),
                authentication
        );
    }
}
