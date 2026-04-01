package com.example.account.vo;

import java.math.BigDecimal;

public record TrendPointVO(
        String date,
        String label,
        BigDecimal amount
) {
}
