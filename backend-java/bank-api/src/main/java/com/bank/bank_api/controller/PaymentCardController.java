package com.bank.bank_api.controller;

import com.bank.bank_api.dto.PaymentCardResponse;
import com.bank.bank_api.dto.RegisterPaymentCardRequest;
import com.bank.bank_api.service.PaymentCardService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/payment-cards")
public class PaymentCardController {

    private final PaymentCardService paymentCardService;

    public PaymentCardController(PaymentCardService paymentCardService) {
        this.paymentCardService = paymentCardService;
    }

    @GetMapping
    public List<PaymentCardResponse> list(Authentication authentication) {
        return paymentCardService.listForCaller(authentication);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentCardResponse register(
            @Valid @RequestBody RegisterPaymentCardRequest request,
            Authentication authentication
    ) {
        return paymentCardService.register(request, authentication);
    }
}
