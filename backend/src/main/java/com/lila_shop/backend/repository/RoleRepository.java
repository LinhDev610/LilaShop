package com.lila_shop.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.lila_shop.backend.entity.Role;

@Repository
public interface RoleRepository extends JpaRepository<Role, String> {}
