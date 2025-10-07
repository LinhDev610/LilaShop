package com.lilashop.backend.mapper;

import org.mapstruct.Mapper;

import com.lilashop.backend.dto.request.PermissionRequest;
import com.lilashop.backend.dto.response.PermissionResponse;
import com.lilashop.backend.entity.Permission;

@Mapper(componentModel = "spring")
public interface PermissionMapper {
    Permission toPermission(PermissionRequest request);

    PermissionResponse toPermissionResponse(Permission permission);
}
