package com.bank.bank_api.util;

import java.time.YearMonth;

public final class CardValidationUtil {

    private static final String HOLDER_NAME_PATTERN = "^[\\p{L}][\\p{L} .'-]{2,119}$";

    private CardValidationUtil() {
    }

    public static void validateHolderName(String holderName) {
        String trimmed = holderName == null ? "" : holderName.trim();
        if (!trimmed.matches(HOLDER_NAME_PATTERN)) {
            throw new IllegalArgumentException(
                    "Nome no cartão inválido: use apenas letras, espaços, hífen ou apóstrofo (mín. 3 caracteres).");
        }
    }

    public static void validateCardNumber(String cardNumber) {
        String digits = cardNumber == null ? "" : cardNumber.replaceAll("\\D", "");
        if (!digits.matches("^\\d{16}$")) {
            throw new IllegalArgumentException("Número do cartão deve ter exatamente 16 dígitos.");
        }
        if (!luhnCheck(digits)) {
            throw new IllegalArgumentException("Número do cartão inválido.");
        }
    }

    public static void validateExpiry(String expiry) {
        if (expiry == null || !expiry.matches("^(0[1-9]|1[0-2])/\\d{2}$")) {
            throw new IllegalArgumentException("Validade inválida. Use o formato MM/AA.");
        }
        String[] parts = expiry.split("/");
        int month = Integer.parseInt(parts[0]);
        int year = 2000 + Integer.parseInt(parts[1]);
        YearMonth cardExpiry = YearMonth.of(year, month);
        if (cardExpiry.isBefore(YearMonth.now())) {
            throw new IllegalArgumentException("O cartão está expirado.");
        }
    }

    public static void validateCvc(String cvc) {
        if (cvc == null || !cvc.matches("^\\d{3}$")) {
            throw new IllegalArgumentException("Código de segurança deve ter exatamente 3 dígitos.");
        }
    }

    static boolean luhnCheck(String digits) {
        int sum = 0;
        boolean alternate = false;
        for (int i = digits.length() - 1; i >= 0; i--) {
            int n = Character.getNumericValue(digits.charAt(i));
            if (alternate) {
                n *= 2;
                if (n > 9) {
                    n -= 9;
                }
            }
            sum += n;
            alternate = !alternate;
        }
        return sum % 10 == 0;
    }
}
