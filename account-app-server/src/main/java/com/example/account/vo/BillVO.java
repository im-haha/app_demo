package com.example.account.vo;

import java.math.BigDecimal;

public record BillVO(
        Long id,
        Long userId,
        String type,
        BigDecimal amount,
        Long categoryId,
        String accountType,
        String billTime,
        String remark,
        String createdAt,
        String updatedAt
) {
}
