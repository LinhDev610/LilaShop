package com.lila_shop.backend.mapper;

import com.lila_shop.backend.dto.request.AddressCreationRequest;
import com.lila_shop.backend.dto.request.AddressUpdateRequest;
import com.lila_shop.backend.dto.response.AddressResponse;
import com.lila_shop.backend.entity.Address;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface AddressMapper {

    // Request to Entity
    @Mapping(target = "addressId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "users", ignore = true)
    @Mapping(target = "country", ignore = true)
    Address toAddress(AddressCreationRequest request);

    // Entity to Response
    @Mapping(target = "id", source = "addressId")
    AddressResponse toAddressResponse(Address address);

    // Update Entity
    @Mapping(target = "addressId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "users", ignore = true)
    @Mapping(target = "country", ignore = true)
    void updateAddress(@MappingTarget Address address, AddressUpdateRequest request);
}

