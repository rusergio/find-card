package com.bank.bank_api.repository;

import com.bank.bank_api.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 💾 Consultas JPA sobre contas (por email do dono, por id+email, etc.).
 */
public interface AccountRepository extends JpaRepository<Account, Long> {

    Optional<Account> findByAccountNumber(String accountNumber);

    /** Todas as contas cujo dono tem este email (cliente normal). */
    List<Account> findAllByUser_Email(String email);

    /** Garante que a conta {@code id} pertence ao utilizador com este email. */
    Optional<Account> findByIdAndUser_Email(Long id, String email);
}
