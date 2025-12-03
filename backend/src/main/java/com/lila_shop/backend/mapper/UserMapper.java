package com.lila_shop.backend.mapper;

import com.lila_shop.backend.dto.request.UserCreationRequest;
import com.lila_shop.backend.dto.request.UserUpdateRequest;
import com.lila_shop.backend.dto.response.UserResponse;
import com.lila_shop.backend.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserMapper {

    // Request to Entity
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "email", ignore = true)
    @Mapping(target = "phoneNumber", ignore = true)
    @Mapping(target = "fullName", ignore = true)
    @Mapping(target = "address", ignore = true)
    @Mapping(target = "avatarUrl", ignore = true)
    @Mapping(target = "createAt", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "reviews", ignore = true)
    @Mapping(target = "notifications", ignore = true)
    @Mapping(target = "addresses", ignore = true)
    @Mapping(target = "cart", ignore = true)
    @Mapping(target = "orders", ignore = true)
    @Mapping(target = "active", ignore = true)
    User toUser(UserCreationRequest request);

    // Entity to Response
    UserResponse toUserResponse(User user);

    // Update Entity
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "email", ignore = true)
    @Mapping(target = "phoneNumber", ignore = true)
    @Mapping(target = "fullName", ignore = true)
    @Mapping(target = "address", ignore = true)
    @Mapping(target = "avatarUrl", ignore = true)
    @Mapping(target = "createAt", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "reviews", ignore = true)
    @Mapping(target = "notifications", ignore = true)
    @Mapping(target = "addresses", ignore = true)
    @Mapping(target = "cart", ignore = true)
    @Mapping(target = "orders", ignore = true)
    @Mapping(target = "active", ignore = true)
    void updateUser(@MappingTarget User user, UserUpdateRequest request);
}
