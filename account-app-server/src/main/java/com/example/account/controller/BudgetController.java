package com.example.account.controller;

import com.example.account.common.ApiResponse;
import com.example.account.dto.BudgetUpsertRequest;
import com.example.account.vo.BudgetVO;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/budget")
public class BudgetController {

    @PostMapping
    public ApiResponse<Void> save(@Valid @RequestBody BudgetUpsertRequest request) {
        return ApiResponse.success(null);
    }

    @GetMapping
    public ApiResponse<BudgetVO> get(@RequestParam String month) {
        return ApiResponse.success(
                new BudgetVO(
                        month,
                        new BigDecimal("3000"),
                        new BigDecimal("0"),
                        new BigDecimal("3000"),
                        0D
                )
        );
    }
}
