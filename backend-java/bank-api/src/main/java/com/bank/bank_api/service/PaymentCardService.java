package com.bank.bank_api.service;

import com.bank.bank_api.dto.PaymentCardResponse;
import com.bank.bank_api.dto.RegisterPaymentCardRequest;
import com.bank.bank_api.entity.PaymentCard;
import com.bank.bank_api.entity.User;
import com.bank.bank_api.exception.ResourceNotFoundException;
import com.bank.bank_api.repository.PaymentCardRepository;
import com.bank.bank_api.repository.UserRepository;
import com.bank.bank_api.util.CardValidationUtil;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PaymentCardService {

    private final PaymentCardRepository paymentCardRepository;
    private final UserRepository userRepository;

    public PaymentCardService(PaymentCardRepository paymentCardRepository, UserRepository userRepository) {
        this.paymentCardRepository = paymentCardRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<PaymentCardResponse> listForCaller(Authentication authentication) {
        String email = requireEmail(authentication);
        if (isAdmin(authentication)) {
            return paymentCardRepository.findAll().stream().map(this::toResponse).toList();
        }
        return paymentCardRepository.findAllByUser_EmailOrderByCreatedAtDesc(email).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PaymentCardResponse register(RegisterPaymentCardRequest request, Authentication authentication) {
        String email = requireEmail(authentication);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        CardValidationUtil.validateHolderName(request.getHolderName());
        CardValidationUtil.validateCardNumber(request.getCardNumber());
        CardValidationUtil.validateExpiry(request.getExpiry());
        CardValidationUtil.validateCvc(request.getCvc());

        String digits = request.getCardNumber().trim();
        String[] expiryParts = request.getExpiry().trim().split("/");
        String month = expiryParts[0];
        String year = expiryParts[1];

        PaymentCard card = PaymentCard.builder()
                .user(user)
                .holderName(request.getHolderName().trim().toUpperCase())
                .lastFourDigits(digits.substring(digits.length() - 4))
                .expiryMonth(month)
                .expiryYear(year)
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        return toResponse(paymentCardRepository.save(card));
    }

    private PaymentCardResponse toResponse(PaymentCard card) {
        String masked = "**** **** **** " + card.getLastFourDigits();
        String expiry = card.getExpiryMonth() + "/" + card.getExpiryYear();
        return new PaymentCardResponse(
                card.getId(),
                card.getHolderName(),
                masked,
                expiry,
                card.getCreatedAt()
        );
    }

    private String requireEmail(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new IllegalArgumentException("Authentication required");
        }
        return authentication.getName();
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> "ADMIN".equals(a.getAuthority()));
    }
}
