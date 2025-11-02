package com.lila_shop.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lila_shop.backend.entity.Order;

public interface OrderRepository extends JpaRepository<Order, String> {}
