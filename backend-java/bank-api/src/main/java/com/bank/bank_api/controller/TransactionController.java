package com.bank.bank_api.controller;

import com.bank.bank_api.entity.Transaction;
import com.bank.bank_api.service.AccountService;
import com.bank.bank_api.service.TransactionService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 📜 Histórico de movimentos por conta.
 * <p>
 * Antes de listar, confirma-se que o pedido pode ver aquela conta (mesma regra que em contas).
 */
@RestController
@RequestMapping("/transactions")
public class TransactionController {

    private final TransactionService transactionService;
    private final AccountService accountService;

    public TransactionController(TransactionService transactionService, AccountService accountService) {
        this.transactionService = transactionService;
        this.accountService = accountService;
    }

    /**
     * 📊 Todas as transações associadas ao {@code accountId} (se tiveres acesso à conta).
     */
    @GetMapping("/account/{accountId}")
    public List<Transaction> getTransactions(
            @PathVariable Long accountId,
            Authentication authentication) {
        accountService.assertCanViewAccount(accountId, authentication);
        return transactionService.getTransactionsByAccount(accountId);
    }
}
