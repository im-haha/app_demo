package com.example.account.common;

import java.util.List;

public record PageResponse<T>(List<T> list, long total) {
}
