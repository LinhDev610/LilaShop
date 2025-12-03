package com.lila_shop.backend.repository;

import com.lila_shop.backend.entity.ExpiredPromotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExpiredPromotionRepository extends JpaRepository<ExpiredPromotion, String> {
    boolean existsById(String id);
}

