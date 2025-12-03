package com.lila_shop.backend.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReviewResponse {

    String id;
    String nameDisplay;
    Integer rating;
    String comment;
    String reply;
    LocalDateTime createdAt;
    LocalDateTime replyAt;

    // User info
    String userId;
    String userName;

    // Product info
    String productId;
    String productName;
}
