package com.lila_shop.backend.mapper;

import com.lila_shop.backend.dto.response.CartItemResponse;
import com.lila_shop.backend.dto.response.CartResponse;
import com.lila_shop.backend.entity.Cart;
import com.lila_shop.backend.entity.CartItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CartMapper {

    @Mapping(target = "items", source = "cartItems")
    CartResponse toResponse(Cart cart);

    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "productName", source = "product.name")
    CartItemResponse toItemResponse(CartItem cartItem);

    @Named("mapItems")
    default List<CartItemResponse> mapItems(List<CartItem> items) {
        if (items == null) return List.of();
        return items.stream().map(this::toItemResponse).toList();
    }
}
