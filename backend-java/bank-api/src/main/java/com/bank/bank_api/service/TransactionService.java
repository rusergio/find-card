package com.bank.bank_api.service;

import com.bank.bank_api.entity.Account;
import com.bank.bank_api.entity.Transaction;
import com.bank.bank_api.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 📝 Persistência do histórico de movimentos (sempre ligado a uma {@link Account}).
 */
@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;

    public TransactionService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    /**
     * 💾 Grava uma linha no extrato (tipo em texto: {@code DEPOSIT}, {@code WITHDRAW}, etc.).
     */
    public void createTransaction(Account account, BigDecimal amount, String type) {
        Transaction transaction = new Transaction();
        transaction.setAccount(account);
        transaction.setAmount(amount);
        transaction.setType(type);
        transaction.setTimestamp(LocalDateTime.now());
        transactionRepository.save(transaction);
    }

    /**
     * 📊 Lista por conta (a autorização “podes ver esta conta?” é feita antes, no controlador).
     */
    public List<Transaction> getTransactionsByAccount(Long accountId) {
        return transactionRepository.findByAccountId(accountId);
    }
}
