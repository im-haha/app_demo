package com.example.account.controller;

import com.example.account.common.ApiResponse;
import com.example.account.vo.CategoryStatVO;
import com.example.account.vo.OverviewVO;
import com.example.account.vo.TrendPointVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    @GetMapping("/overview")
    public ApiResponse<OverviewVO> overview() {
        return ApiResponse.success(
                new OverviewVO(
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO
                )
        );
    }

    @GetMapping("/category")
    public ApiResponse<List<CategoryStatVO>> category(@RequestParam String type, @RequestParam String month) {
        return ApiResponse.success(List.of());
    }

    @GetMapping("/trend")
    public ApiResponse<List<TrendPointVO>> trend(@RequestParam String type, @RequestParam String range) {
        return ApiResponse.success(List.of());
    }
}
