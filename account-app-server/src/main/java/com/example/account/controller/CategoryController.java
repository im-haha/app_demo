package com.example.account.controller;

import com.example.account.common.ApiResponse;
import com.example.account.dto.CategoryUpsertRequest;
import com.example.account.vo.CategoryVO;
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

import java.util.List;

@RestController
@RequestMapping("/api/category")
public class CategoryController {

    @GetMapping("/list")
    public ApiResponse<List<CategoryVO>> list(@RequestParam(required = false) String type) {
        return ApiResponse.success(
                List.of(
                        new CategoryVO(1L, null, "EXPENSE", "餐饮", "silverware-fork-knife", "#D97757", 0, true),
                        new CategoryVO(7L, null, "INCOME", "工资", "briefcase-variant", "#1F8A70", 0, true)
                )
        );
    }

    @PostMapping
    public ApiResponse<Void> create(@Valid @RequestBody CategoryUpsertRequest request) {
        return ApiResponse.success(null);
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> update(@PathVariable Long id, @Valid @RequestBody CategoryUpsertRequest request) {
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        return ApiResponse.success(null);
    }
}
