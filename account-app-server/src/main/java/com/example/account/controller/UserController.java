package com.example.account.controller;

import com.example.account.common.ApiResponse;
import com.example.account.dto.UserProfileUpdateRequest;
import com.example.account.vo.UserVO;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @GetMapping("/me")
    public ApiResponse<UserVO> me() {
        return ApiResponse.success(new UserVO(1L, "demo_user", "离线用户", null, 1));
    }

    @PutMapping("/profile")
    public ApiResponse<UserVO> updateProfile(@Valid @RequestBody UserProfileUpdateRequest request) {
        return ApiResponse.success(new UserVO(1L, "demo_user", request.nickname(), null, 1));
    }
}
