package com.lila_shop.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lila_shop.backend.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, String> {}
