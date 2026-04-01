package com.example.account.vo;

public record CategoryVO(
        Long id,
        Long userId,
        String type,
        String name,
        String icon,
        String color,
        Integer sortNum,
        Boolean isDefault
) {
}
