package com.lila_shop.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lila_shop.backend.entity.SupportTicket;
import com.lila_shop.backend.enums.TicketStatus;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, String> {
    List<SupportTicket> findByStatus(TicketStatus status);
}
