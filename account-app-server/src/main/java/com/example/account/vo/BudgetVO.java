package com.example.account.vo;

import java.math.BigDecimal;

public record BudgetVO(
        String month,
        BigDecimal budgetAmount,
        BigDecimal spentAmount,
        BigDecimal remainingAmount,
        Double usageRate
) {
}
