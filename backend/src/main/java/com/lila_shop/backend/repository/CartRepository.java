package com.lila_shop.backend.repository;

import com.lila_shop.backend.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, String> {

    @Query("select c from Cart c where c.user.id = :userId")
    Optional<Cart> findByUserId(@Param("userId") String userId);
}
