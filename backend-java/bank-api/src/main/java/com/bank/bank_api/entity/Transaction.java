package com.bank.bank_api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 📜 Linha de extrato: montante (positivo ou negativo), tipo textual e data.
 * <p>
 * Tipos usados na app: {@code DEPOSIT}, {@code WITHDRAW}, {@code TRANSFER_OUT}, {@code TRANSFER_IN}.
 */
@Entity
@Table(name = "transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 💶 Valor do movimento (pode ser negativo em débitos). */
    private BigDecimal amount;

    /** 🏷️ Tipo do movimento (string para simplicidade na fase 1). */
    private String type;

    /** 🕐 Quando foi registado. */
    private LocalDateTime timestamp;

    @ManyToOne
    @JoinColumn(name = "account_id")
    private Account account;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public Account getAccount() {
        return account;
    }

    public void setAccount(Account account) {
        this.account = account;
    }
}
