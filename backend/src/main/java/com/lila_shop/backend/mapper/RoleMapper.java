package com.lila_shop.backend.mapper;

import com.lila_shop.backend.dto.request.RoleRequest;
import com.lila_shop.backend.dto.response.RoleResponse;
import com.lila_shop.backend.entity.Role;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface RoleMapper {
    @Mapping(
            target = "permissions",
            ignore = true) // ignore vì kiểu dữ liệu của permissions trong request khác permission và response
    Role toRole(RoleRequest request);

    RoleResponse toRoleResponse(Role role);
}
