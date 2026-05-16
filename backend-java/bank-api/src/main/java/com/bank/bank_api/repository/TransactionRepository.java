package com.bank.bank_api.repository;

import com.bank.bank_api.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * 💾 Histórico de transações; o nome do método define a query automaticamente.
 */
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    /** Extrato completo de uma conta (por chave estrangeira {@code account_id}). */
    List<Transaction> findByAccountId(Long accountId);
}
