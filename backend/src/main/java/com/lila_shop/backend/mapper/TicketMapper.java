package com.lila_shop.backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.lila_shop.backend.dto.request.TicketCreationRequest;
import com.lila_shop.backend.dto.response.TicketResponse;
import com.lila_shop.backend.entity.SupportTicket;

@Mapper(componentModel = "spring")
public interface TicketMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "assignedTo", ignore = true)
    @Mapping(target = "handlerNote", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    SupportTicket toEntity(TicketCreationRequest request);

    TicketResponse toResponse(SupportTicket ticket);
}
