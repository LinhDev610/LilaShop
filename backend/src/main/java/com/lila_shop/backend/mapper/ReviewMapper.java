package com.lila_shop.backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.lila_shop.backend.dto.request.ReviewCreationRequest;
import com.lila_shop.backend.dto.response.ReviewResponse;
import com.lila_shop.backend.entity.Review;

@Mapper(componentModel = "spring")
public interface ReviewMapper {

    // Entity to Response
    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "userName", source = "user.fullName")
    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "productName", source = "product.name")
    ReviewResponse toReviewResponse(Review review);

    // Request to Entity
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "replyAt", ignore = true)
    @Mapping(target = "reply", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "product", ignore = true)
    Review toReview(ReviewCreationRequest request);
}
