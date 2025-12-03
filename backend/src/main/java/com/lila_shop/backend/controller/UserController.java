package com.lila_shop.backend.controller;

import com.lila_shop.backend.dto.request.ApiResponse;
import com.lila_shop.backend.dto.request.StaffCreationRequest;
import com.lila_shop.backend.dto.request.UserCreationRequest;
import com.lila_shop.backend.dto.request.UserUpdateRequest;
import com.lila_shop.backend.dto.response.UserResponse;
import com.lila_shop.backend.entity.Role;
import com.lila_shop.backend.repository.RoleRepository;
import com.lila_shop.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserController {
    UserService userService;
    RoleRepository roleRepository;

    @PostMapping
    ApiResponse<UserResponse> createUser(@RequestBody @Valid UserCreationRequest request) {
        log.info("Controller: create User");
        return ApiResponse.<UserResponse>builder()
                .result(userService.createUser(request))
                .build();
    }

    @PostMapping("/staff")
    ApiResponse<UserResponse> createStaff(@RequestBody @Valid StaffCreationRequest request) {
        log.info("Controller: create Staff");
        return ApiResponse.<UserResponse>builder()
                .result(userService.createStaff(request))
                .build();
    }

    @GetMapping
    ApiResponse<List<UserResponse>> getUsers() {
        return ApiResponse.<List<UserResponse>>builder()
                .result(userService.getUsers())
                .build();
    }

    @GetMapping("/my-info")
    ApiResponse<UserResponse> getMyInfo() {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getMyInfo())
                .build();
    }

    @DeleteMapping("/{userId}")
    ApiResponse<String> deleteUser(@PathVariable String userId) {
        userService.deleteUser(userId);
        return ApiResponse.<String>builder().result("User has been deleted").build();
    }

    @GetMapping("/{userId}")
    ApiResponse<UserResponse> getUser(@PathVariable String userId) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getUser(userId))
                .build();
    }

    @PutMapping("/{userId}")
    ApiResponse<UserResponse> updateUser(@PathVariable String userId, @RequestBody UserUpdateRequest request) {
        try {
            UserResponse result = userService.updateUser(userId, request);
            return ApiResponse.<UserResponse>builder()
                    .result(result)
                    .build();
        } catch (Exception e) {
            log.error("Controller: updateUser failed - userId: {}, error: {}", userId, e.getMessage(), e);
            throw e;
        }
    }

    @GetMapping("/roles")
    ApiResponse<List<Role>> getRoles() {
        log.info("Controller: get all roles");
        return ApiResponse.<List<Role>>builder()
                .result(roleRepository.findAll())
                .build();
    }
}
