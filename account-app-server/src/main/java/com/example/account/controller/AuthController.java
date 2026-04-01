package com.example.account.controller;

import com.example.account.common.ApiResponse;
import com.example.account.dto.AuthLoginRequest;
import com.example.account.dto.AuthRegisterRequest;
import com.example.account.vo.AuthLoginVO;
import com.example.account.vo.UserVO;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/register")
    public ApiResponse<AuthLoginVO> register(@Valid @RequestBody AuthRegisterRequest request) {
        return ApiResponse.success(
                new AuthLoginVO(
                        "mock-jwt-token",
                        new UserVO(1L, request.username(), request.nickname(), null, 1)
                )
        );
    }

    @PostMapping("/login")
    public ApiResponse<AuthLoginVO> login(@Valid @RequestBody AuthLoginRequest request) {
        return ApiResponse.success(
                new AuthLoginVO(
                        "mock-jwt-token",
                        new UserVO(1L, request.username(), "离线用户", null, 1)
                )
        );
    }
}
