package com.lilashop.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.lilashop.backend.entity.Permission;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, String> {}
