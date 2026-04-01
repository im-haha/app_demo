package com.example.account.controller;

import com.example.account.common.ApiResponse;
import com.example.account.common.PageResponse;
import com.example.account.dto.BillUpsertRequest;
import com.example.account.vo.BillVO;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/bill")
public class BillController {

    @PostMapping
    public ApiResponse<Void> create(@Valid @RequestBody BillUpsertRequest request) {
        return ApiResponse.success(null);
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> update(@PathVariable Long id, @Valid @RequestBody BillUpsertRequest request) {
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        return ApiResponse.success(null);
    }

    @GetMapping("/{id}")
    public ApiResponse<BillVO> detail(@PathVariable Long id) {
        return ApiResponse.success(
                new BillVO(
                        id,
                        1L,
                        "EXPENSE",
                        new BigDecimal("35.50"),
                        1L,
                        "WECHAT",
                        "2026-04-01 09:30:00",
                        "早餐",
                        "2026-04-01 09:31:00",
                        "2026-04-01 09:31:00"
                )
        );
    }

    @GetMapping("/page")
    public ApiResponse<PageResponse<BillVO>> page(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String keyword
    ) {
        return ApiResponse.success(new PageResponse<>(List.of(), 0));
    }
}
