package com.bank.bank_api.service;

import com.bank.bank_api.entity.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * 🎫 Gera e valida tokens JWT (assinatura HMAC, claims {@code sub}=email e {@code role}).
 * <p>
 * ⚠️ Chave fixa só para desenvolvimento — em produção usar variável de ambiente ou vault.
 */
@Service
public class JwtService {

    /** Chave simétrica; o JJWT exige comprimento mínimo para HMAC-SHA. */
    private final SecretKey SECRET_KEY = Keys.hmacShaKeyFor(
            "mysecretkeymysecretkeymysecretkey12".getBytes()
    );

    /** Duração do token: 24 horas em milissegundos. */
    private static final long TOKEN_TTL_MS = 86400000L;

    /**
     * ✨ Constrói o JWT com email no subject e nome do {@link com.bank.bank_api.entity.Role} como claim.
     */
    public String generateToken(User user) {
        return Jwts.builder()
                .subject(user.getEmail())
                .claim("role", user.getRole().name())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + TOKEN_TTL_MS))
                .signWith(SECRET_KEY)
                .compact();
    }

    /**
     * 📧 Lê o email guardado no subject do token.
     */
    public String extractEmail(String token) {
        return Jwts.parser()
                .verifyWith(SECRET_KEY)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    /**
     * 👤 Lê a role (ex.: {@code USER}, {@code ADMIN}) a partir do claim {@code role}.
     */
    public String extractRole(String token) {
        return Jwts.parser()
                .verifyWith(SECRET_KEY)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("role", String.class);
    }
}
