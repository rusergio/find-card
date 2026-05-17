package com.bank.bank_api.repository;

import com.bank.bank_api.entity.PaymentCard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentCardRepository extends JpaRepository<PaymentCard, Long> {

    List<PaymentCard> findAllByUser_EmailOrderByCreatedAtDesc(String email);

    Optional<PaymentCard> findByIdAndUser_Email(Long id, String email);
}
