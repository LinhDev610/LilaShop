package com.lila_shop.backend.repository;

import com.lila_shop.backend.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AddressRepository extends JpaRepository<Address,String> {
    boolean existsByAddressId(String id);
}
