package com.example.account.vo;

public record UserVO(
        Long id,
        String username,
        String nickname,
        String avatar,
        Integer status
) {
}
