package com.lila_shop.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.lila_shop.backend.entity.User;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    // Check if email exists
    boolean existsByEmail(String email);

    // Find user by email
    Optional<User> findByEmail(String email);
}
