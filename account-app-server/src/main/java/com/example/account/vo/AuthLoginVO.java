package com.example.account.vo;

public record AuthLoginVO(
        String token,
        UserVO user
) {
}
