package com.example.account.vo;

import java.math.BigDecimal;

public record CategoryStatVO(
        Long categoryId,
        String categoryName,
        String color,
        BigDecimal amount,
        Double percentage
) {
}
