package com.lila_shop.backend.repository;

import com.lila_shop.backend.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ShipmentRepository extends JpaRepository<Shipment, String> {
    Optional<Shipment> findByOrderCode(String orderCode);

    @Query("select s from Shipment s where s.order.id = :orderId")
    Optional<Shipment> findByOrderId(@Param("orderId") String orderId);
}
