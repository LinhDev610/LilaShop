package com.lila_shop.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lila_shop.backend.entity.Payment;

public interface PaymentRepository extends JpaRepository<Payment, String> {}
