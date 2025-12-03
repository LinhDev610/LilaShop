package com.lila_shop.backend.service;

import com.lila_shop.backend.dto.request.AddressCreationRequest;
import com.lila_shop.backend.dto.request.AddressUpdateRequest;
import com.lila_shop.backend.dto.response.AddressResponse;
import com.lila_shop.backend.entity.Address;
import com.lila_shop.backend.entity.User;
import com.lila_shop.backend.exception.AppException;
import com.lila_shop.backend.exception.ErrorCode;
import com.lila_shop.backend.mapper.AddressMapper;
import com.lila_shop.backend.repository.AddressRepository;
import com.lila_shop.backend.repository.UserRepository;
import com.lila_shop.backend.util.SecurityUtil;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AddressService {

    AddressRepository addressRepository;
    AddressMapper addressMapper;
    UserRepository userRepository;

    @Transactional
    public AddressResponse createAddress(AddressCreationRequest request) {
        User currentUser = getCurrentUser();

        Address address = addressMapper.toAddress(request);
        address.setCreatedAt(LocalDateTime.now());
        address.setUpdatedAt(LocalDateTime.now());
        address.setCountry("Việt Nam"); // Default country
        address.setDefaultAddress(request.isDefaultAddress());

        if (request.isDefaultAddress()) {
            unsetOtherDefaults(currentUser, null);
        }

        Address savedAddress = addressRepository.save(address);

        currentUser.getAddresses().add(savedAddress);
        userRepository.save(currentUser);

        log.info("Address created with ID: {} for user: {}", savedAddress.getAddressId(), currentUser.getEmail());
        return addressMapper.toAddressResponse(savedAddress);
    }

    public AddressResponse getAddressById(String addressId) {
        User currentUser = getCurrentUser();
        Address address = getOwnedAddress(addressId, currentUser);

        return addressMapper.toAddressResponse(address);
    }

    public List<AddressResponse> getMyAddresses() {
        User currentUser = getCurrentUser();

        return currentUser.getAddresses().stream()
                .map(addressMapper::toAddressResponse)
                .toList();
    }

    @Transactional
    public AddressResponse updateAddress(String addressId, AddressUpdateRequest request) {
        User currentUser = getCurrentUser();
        Address address = getOwnedAddress(addressId, currentUser);

        if (request.isDefaultAddress()) {
            unsetOtherDefaults(currentUser, addressId);
        }

        addressMapper.updateAddress(address, request);
        address.setDefaultAddress(request.isDefaultAddress());
        address.setUpdatedAt(LocalDateTime.now());

        Address savedAddress = addressRepository.save(address);
        log.info("Address updated with ID: {} for user: {}", savedAddress.getAddressId(), currentUser.getEmail());
        return addressMapper.toAddressResponse(savedAddress);
    }

    @Transactional
    public void deleteAddress(String addressId) {
        User currentUser = getCurrentUser();
        Address address = getOwnedAddress(addressId, currentUser);

        currentUser.getAddresses().remove(address);
        userRepository.save(currentUser);

        addressRepository.delete(address);
        log.info("Address deleted with ID: {} for user: {}", addressId, currentUser.getEmail());
    }

    private User getCurrentUser() {
        String currentEmail = SecurityUtil.getCurrentUserEmail();
        return userRepository
                .findByEmail(currentEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private Address getOwnedAddress(String addressId, User owner) {
        Address address = addressRepository
                .findById(addressId)
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_EXISTED));

        boolean ownsAddress = owner.getAddresses().stream()
                .anyMatch(addr -> addr.getAddressId().equals(addressId));

        if (!ownsAddress) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        return address;
    }

    private void unsetOtherDefaults(User currentUser, String excludeAddressId) {
        currentUser.getAddresses().stream()
                .filter(Address::isDefaultAddress)
                .filter(addr -> excludeAddressId == null || !addr.getAddressId().equals(excludeAddressId))
                .forEach(addr -> {
                    addr.setDefaultAddress(false);
                    addressRepository.save(addr);
                });
    }
}
