package com.lila_shop.backend.configuration;

import com.lila_shop.backend.entity.Category;
import com.lila_shop.backend.repository.CategoryRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class CategoryInitConfig {

    CategoryRepository categoryRepository;

    @Bean
    @ConditionalOnProperty(
            prefix = "app",
            value = "init-categories",
            havingValue = "true",
            matchIfMissing = false)
    ApplicationRunner categoryInitializer() {
        log.info("Initializing cosmetic categories...");
        return args -> {
            // Kiểm tra xem đã có categories chưa
            if (categoryRepository.count() > 0) {
                log.info("Categories already exist, skipping initialization.");
                return;
            }

            try {
                // 1. Chăm sóc da (Skincare)
                Category skincare = createRootCategory(
                        "CAT_SKINCARE",
                        "Chăm sóc da",
                        "Các sản phẩm chăm sóc da mặt và cơ thể: kem dưỡng, serum, mặt nạ, tẩy trang, rửa mặt"
                );

                // Subcategories cho Chăm sóc da
                createSubCategory("CAT_SKINCARE_CLEANSER", "Sữa rửa mặt", "Sữa rửa mặt, gel rửa mặt, tẩy trang", skincare);
                createSubCategory("CAT_SKINCARE_TONER", "Nước hoa hồng", "Toner, nước hoa hồng cân bằng da", skincare);
                createSubCategory("CAT_SKINCARE_SERUM", "Serum", "Serum dưỡng da, tinh chất đặc trị", skincare);
                createSubCategory("CAT_SKINCARE_MOISTURIZER", "Kem dưỡng ẩm", "Kem dưỡng ẩm, lotion, gel dưỡng", skincare);
                createSubCategory("CAT_SKINCARE_SUNSCREEN", "Kem chống nắng", "Kem chống nắng, SPF", skincare);
                createSubCategory("CAT_SKINCARE_MASK", "Mặt nạ", "Mặt nạ giấy, mặt nạ đất sét, mặt nạ ngủ", skincare);
                createSubCategory("CAT_SKINCARE_EYE", "Chăm sóc mắt", "Kem mắt, serum mắt, gel mắt", skincare);

                // 2. Trang điểm (Makeup)
                Category makeup = createRootCategory(
                        "CAT_MAKEUP",
                        "Trang điểm",
                        "Các sản phẩm trang điểm: foundation, phấn má, son môi, mascara, eyeliner, phấn mắt"
                );

                // Subcategories cho Trang điểm
                createSubCategory("CAT_MAKEUP_FACE", "Nền trang điểm", "Foundation, BB cream, CC cream, concealer, phấn nền", makeup);
                createSubCategory("CAT_MAKEUP_EYE", "Trang điểm mắt", "Mascara, eyeliner, phấn mắt, chì kẻ mắt", makeup);
                createSubCategory("CAT_MAKEUP_LIP", "Son môi", "Son môi, son bóng, son dưỡng, lip tint", makeup);
                createSubCategory("CAT_MAKEUP_CHEEK", "Má hồng", "Phấn má, cream blush, highlighter", makeup);
                createSubCategory("CAT_MAKEUP_BROW", "Chân mày", "Chì kẻ mày, gel cố định mày, phấn mày", makeup);
                createSubCategory("CAT_MAKEUP_TOOL", "Dụng cụ trang điểm", "Cọ trang điểm, bông mút, bàn chải", makeup);

                // 3. Chăm sóc tóc (Haircare)
                Category haircare = createRootCategory(
                        "CAT_HAIRCARE",
                        "Chăm sóc tóc",
                        "Các sản phẩm chăm sóc tóc: dầu gội, dầu xả, serum tóc, mặt nạ tóc, thuốc nhuộm"
                );

                // Subcategories cho Chăm sóc tóc
                createSubCategory("CAT_HAIRCARE_SHAMPOO", "Dầu gội", "Dầu gội đầu, dầu gội khô", haircare);
                createSubCategory("CAT_HAIRCARE_CONDITIONER", "Dầu xả", "Dầu xả, kem ủ tóc", haircare);
                createSubCategory("CAT_HAIRCARE_TREATMENT", "Điều trị tóc", "Serum tóc, mặt nạ tóc, tinh dầu tóc", haircare);
                createSubCategory("CAT_HAIRCARE_STYLING", "Tạo kiểu", "Gel tóc, sáp tóc, keo xịt tóc", haircare);
                createSubCategory("CAT_HAIRCARE_COLOR", "Nhuộm tóc", "Thuốc nhuộm tóc, thuốc tẩy tóc", haircare);

                // 4. Nước hoa (Fragrance)
                Category fragrance = createRootCategory(
                        "CAT_FRAGRANCE",
                        "Nước hoa",
                        "Các sản phẩm nước hoa: nước hoa nam, nước hoa nữ, nước hoa unisex, body mist"
                );

                // Subcategories cho Nước hoa
                createSubCategory("CAT_FRAGRANCE_WOMEN", "Nước hoa nữ", "Nước hoa dành cho nữ", fragrance);
                createSubCategory("CAT_FRAGRANCE_MEN", "Nước hoa nam", "Nước hoa dành cho nam", fragrance);
                createSubCategory("CAT_FRAGRANCE_UNISEX", "Nước hoa unisex", "Nước hoa dùng chung", fragrance);
                createSubCategory("CAT_FRAGRANCE_BODY", "Body mist", "Body mist, body spray", fragrance);

                // 5. Chăm sóc cơ thể (Bodycare)
                Category bodycare = createRootCategory(
                        "CAT_BODYCARE",
                        "Chăm sóc cơ thể",
                        "Các sản phẩm chăm sóc cơ thể: sữa tắm, kem dưỡng body, xà phòng, tẩy tế bào chết"
                );

                // Subcategories cho Chăm sóc cơ thể
                createSubCategory("CAT_BODYCARE_BATH", "Sữa tắm", "Sữa tắm, gel tắm, xà phòng", bodycare);
                createSubCategory("CAT_BODYCARE_LOTION", "Kem dưỡng body", "Kem dưỡng thể, lotion body", bodycare);
                createSubCategory("CAT_BODYCARE_SCRUB", "Tẩy tế bào chết", "Scrub body, tẩy da chết", bodycare);
                createSubCategory("CAT_BODYCARE_HAND", "Chăm sóc tay chân", "Kem tay, kem chân, dưỡng móng", bodycare);

                log.info("Cosmetic categories initialized successfully!");
            } catch (Exception e) {
                log.error("Error initializing categories", e);
            }
        };
    }

    private Category createRootCategory(String id, String name, String description) {
        return categoryRepository.findByName(name)
                .orElseGet(() -> {
                    Category category = Category.builder()
                            .id(id)
                            .name(name)
                            .description(description)
                            .status(true)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .parentCategory(null)
                            .build();
                    return categoryRepository.save(category);
                });
    }

    private Category createSubCategory(String id, String name, String description, Category parent) {
        return categoryRepository.findByName(name)
                .orElseGet(() -> {
                    Category category = Category.builder()
                            .id(id)
                            .name(name)
                            .description(description)
                            .status(true)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .parentCategory(parent)
                            .build();
                    return categoryRepository.save(category);
                });
    }
}

