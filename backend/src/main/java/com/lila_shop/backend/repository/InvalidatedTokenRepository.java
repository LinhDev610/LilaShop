package com.lila_shop.backend.repository;

import com.lila_shop.backend.entity.InvalidatedToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;

// Lưu trữ token hết hạn
@Repository
public interface InvalidatedTokenRepository extends JpaRepository<InvalidatedToken, String> {

    @Modifying
    @Transactional
    @Query(
            value =
                    "INSERT INTO invalidated_token (id, expiry_time) VALUES (:id, :expiryTime) ON DUPLICATE KEY UPDATE expiry_time = :expiryTime",
            nativeQuery = true)
    void saveOrUpdate(@Param("id") String id, @Param("expiryTime") Date expiryTime);
}
