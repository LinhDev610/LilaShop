package com.lila_shop.backend.repository;

import com.lila_shop.backend.entity.Banner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BannerRepository extends JpaRepository<Banner, String> {
    List<Banner> findAllByOrderByOrderIndexAsc();

    List<Banner> findByStatusOrderByOrderIndexAsc(boolean status);

    @Query("SELECT COALESCE(MAX(b.orderIndex), 0) FROM Banner b")
    Integer findMaxOrderIndex();
}
