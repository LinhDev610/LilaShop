package com.lila_shop.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.lila_shop.backend.entity.CosmeticProduct;

@Repository
public interface CosmeticProductRepository
        extends JpaRepository<CosmeticProduct, String>, JpaSpecificationExecutor<CosmeticProduct> {}



