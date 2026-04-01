package com.example.account.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record BudgetUpsertRequest(
        @NotBlank String month,
        @NotNull @DecimalMin("0.01") BigDecimal amount
) {
}
