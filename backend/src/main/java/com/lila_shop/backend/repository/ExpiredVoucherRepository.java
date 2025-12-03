package com.lila_shop.backend.repository;

import com.lila_shop.backend.entity.ExpiredVoucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExpiredVoucherRepository extends JpaRepository<ExpiredVoucher, String> {
    boolean existsById(String id);
}
