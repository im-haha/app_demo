package com.example.account.vo;

import java.math.BigDecimal;

public record OverviewVO(
        BigDecimal todayIncome,
        BigDecimal todayExpense,
        BigDecimal monthIncome,
        BigDecimal monthExpense,
        BigDecimal monthBalance
) {
}
