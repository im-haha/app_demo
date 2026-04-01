package com.example.account.dto;

import jakarta.validation.constraints.NotBlank;

public record CategoryUpsertRequest(
        @NotBlank String type,
        @NotBlank String name,
        @NotBlank String icon,
        @NotBlank String color
) {
}
