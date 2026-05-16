package com.bank.bank_api.service;

import com.bank.bank_api.entity.Account;
import com.bank.bank_api.entity.User;
import com.bank.bank_api.exception.InsufficientBalanceException;
import com.bank.bank_api.exception.ResourceNotFoundException;
import com.bank.bank_api.repository.AccountRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Random;

/**
 * 💼 Regras de negócio das contas: criar conta, movimentar saldo e respeitar dono vs ADMIN.
 */
@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final TransactionService transactionService;

    public AccountService(AccountRepository accountRepository, TransactionService transactionService) {
        this.accountRepository = accountRepository;
        this.transactionService = transactionService;
    }

    /**
     * 🏦 Cria conta nova ligada ao utilizador (chamado após registo ou seed do admin).
     */
    public Account createAccountForUser(User user) {
        Account account = new Account();
        account.setAccountNumber(generateAccountNumber());
        account.setBalance(BigDecimal.ZERO);
        account.setCurrency("EUR");
        account.setCreatedAt(LocalDateTime.now());
        account.setUser(user);
        return accountRepository.save(account);
    }

    /**
     * 🔢 Número de conta “aleatório” de 9 dígitos (demo — em produção usaríamos outra estratégia / unicidade na BD).
     */
    public String generateAccountNumber() {
        Random random = new Random();
        int number = 100000000 + random.nextInt(900000000);
        return String.valueOf(number);
    }

    /**
     * ➕ Depósito: atualiza saldo e grava linha de transação {@code DEPOSIT}.
     */
    @Transactional
    public Account deposit(Long accountId, BigDecimal amount, Authentication authentication) {
        requirePositiveAmount(amount);
        Account account = resolveWritableAccount(accountId, authentication);
        account.setBalance(account.getBalance().add(amount));
        transactionService.createTransaction(account, amount, "DEPOSIT");
        return accountRepository.save(account);
    }

    /**
     * 🔁 Transferência: debita origem, credita destino, duas linhas ({@code TRANSFER_OUT} / {@code TRANSFER_IN}).
     */
    @Transactional
    public void transfer(Long fromId, Long toId, BigDecimal amount, Authentication authentication) {
        requirePositiveAmount(amount);

        Account fromAccount = resolveWritableAccount(fromId, authentication);
        Account toAccount = accountRepository.findById(toId)
                .orElseThrow(() -> new ResourceNotFoundException("Destination account not found"));

        if (fromAccount.getId().equals(toAccount.getId())) {
            throw new IllegalArgumentException("Cannot transfer to the same account");
        }

        if (fromAccount.getBalance().compareTo(amount) < 0) {
            throw new InsufficientBalanceException("Insufficient balance");
        }

        fromAccount.setBalance(fromAccount.getBalance().subtract(amount));
        toAccount.setBalance(toAccount.getBalance().add(amount));

        accountRepository.save(fromAccount);
        accountRepository.save(toAccount);

        transactionService.createTransaction(fromAccount, amount.negate(), "TRANSFER_OUT");
        transactionService.createTransaction(toAccount, amount, "TRANSFER_IN");
    }

    /**
     * ➖ Levantamento: debita saldo se houver fundos suficientes.
     */
    @Transactional
    public Account withdraw(Long accountId, BigDecimal amount, Authentication authentication) {
        requirePositiveAmount(amount);
        Account account = resolveWritableAccount(accountId, authentication);

        if (account.getBalance().compareTo(amount) < 0) {
            throw new InsufficientBalanceException("Insufficient balance");
        }

        account.setBalance(account.getBalance().subtract(amount));
        transactionService.createTransaction(account, amount.negate(), "WITHDRAW");
        return accountRepository.save(account);
    }

    /**
     * 🔍 Conta por ID se o caller puder lê-la.
     */
    public Account getAccountForCaller(Long accountId, Authentication authentication) {
        return resolveReadableAccount(accountId, authentication);
    }

    /**
     * 📋 ADMIN vê tudo; USER só as contas onde {@code user.email} coincide com o principal JWT.
     */
    public java.util.List<Account> listAccountsForCaller(Authentication authentication) {
        if (isAdmin(authentication)) {
            return accountRepository.findAll();
        }
        return accountRepository.findAllByUser_Email(authentication.getName());
    }

    /**
     * ✅ Garante permissão de leitura (ex.: antes de listar transações).
     */
    public void assertCanViewAccount(Long accountId, Authentication authentication) {
        resolveReadableAccount(accountId, authentication);
    }

    /** Conta onde o utilizador pode debitar (origem de transferência, levantamento, depósito na “sua” conta). */
    private Account resolveWritableAccount(Long accountId, Authentication authentication) {
        if (isAdmin(authentication)) {
            return accountRepository.findById(accountId)
                    .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        }
        return accountRepository.findByIdAndUser_Email(accountId, authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
    }

    /** Conta visível em consultas (mesma regra: dono ou ADMIN). */
    private Account resolveReadableAccount(Long accountId, Authentication authentication) {
        if (isAdmin(authentication)) {
            return accountRepository.findById(accountId)
                    .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        }
        return accountRepository.findByIdAndUser_Email(accountId, authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
    }

    /** Valor monetário tem de ser &gt; 0 (null também é inválido). */
    private void requirePositiveAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }
    }

    /** 🛡️ Verifica autoridade {@code ADMIN} no contexto Spring Security. */
    private boolean isAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> "ADMIN".equals(a.getAuthority()));
    }
}
