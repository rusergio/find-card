package com.bank.bank_api.repository;

import com.bank.bank_api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 💾 Acesso à tabela {@code users} (Spring Data gera implementações em runtime).
 */
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    /** Útil no registo para evitar email duplicado antes do insert. */
    boolean existsByEmail(String email);
}
