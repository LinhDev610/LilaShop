package com.lila_shop.backend.mapper;

import com.lila_shop.backend.dto.request.PermissionRequest;
import com.lila_shop.backend.dto.response.PermissionResponse;
import com.lila_shop.backend.entity.Permission;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PermissionMapper {
    Permission toPermission(PermissionRequest request);

    PermissionResponse toPermissionResponse(Permission permission);
}
