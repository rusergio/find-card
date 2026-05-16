package com.bank.bank_api.entity;

/**
 * 👤 Perfis de utilizador na API (aparecem no JWT e na segurança).
 * <ul>
 *     <li>{@code USER} — cliente bancário normal</li>
 *     <li>{@code ADMIN} — acesso alargado (ex.: ver todas as contas em testes)</li>
 *     <li>{@code EMPLOYEE} — reservado para fases futuras (funcionário)</li>
 * </ul>
 */
public enum Role {
    USER,
    ADMIN,
    EMPLOYEE
}
