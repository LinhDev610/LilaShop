package com.lila_shop.backend.repository;

import com.lila_shop.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    // Check if email exists
    boolean existsByEmail(String email);

    // Find user by email
    Optional<User> findByEmail(String email);

    boolean existsByIdAndUsedVouchers_Id(String userId, String voucherId);
}
