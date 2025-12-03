package com.lila_shop.backend.repository;

import com.lila_shop.backend.entity.SupportTicket;
import com.lila_shop.backend.enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, String> {
    List<SupportTicket> findByStatus(TicketStatus status);
    
    // Find all tickets ordered by createdAt descending (newest first)
    List<SupportTicket> findAllByOrderByCreatedAtDesc();
    
    // Find tickets by status ordered by createdAt descending (newest first)
    List<SupportTicket> findByStatusOrderByCreatedAtDesc(TicketStatus status);
}
