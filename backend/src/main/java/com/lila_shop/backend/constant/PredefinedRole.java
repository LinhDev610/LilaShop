package com.lila_shop.backend.constant;

import com.lila_shop.backend.entity.Role;
import lombok.experimental.FieldDefaults;

@FieldDefaults(makeFinal = true)
public class PredefinedRole {
    //    public static final String USER_ROLE = "USER";
    public static Role CUSTOMER_ROLE =
            Role.builder().name("CUSTOMER").description("Customer role").build();
    public static Role ADMIN_ROLE =
            Role.builder().name("ADMIN").description("Admin role").build();
    public static Role STAFF_ROLE =
            Role.builder().name("STAFF").description("Staff role").build();
    public static Role CS_ROLE = Role.builder()
            .name("CUSTOMER_SUPPORT")
            .description("Customer Support role")
            .build();

    private PredefinedRole() {}
}
