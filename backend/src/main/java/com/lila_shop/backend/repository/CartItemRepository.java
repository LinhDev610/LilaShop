package com.lila_shop.backend.repository;

import com.lila_shop.backend.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, String> {

    @Query("select ci from CartItem ci where ci.cart.id = :cartId and ci.product.id = :productId and (ci.variant.id = :variantId or (:variantId is null and ci.variant is null))")
    Optional<CartItem> findByCartIdAndProductIdAndVariantId(@Param("cartId") String cartId,
            @Param("productId") String productId, @Param("variantId") String variantId);
}
