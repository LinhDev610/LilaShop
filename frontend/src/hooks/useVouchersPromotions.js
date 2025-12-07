import { useState, useEffect, useMemo } from 'react';
import { getActiveVouchers, getActivePromotions } from '../services/api';
import { getApiBaseUrl } from '../services/utils';
import { normalizeVoucherImageUrl, normalizePromotionImageUrl } from '../services/voucherPromotionUtils';

// Cache for vouchers and promotions
const cache = {
    vouchers: { data: null, timestamp: null },
    promotions: { data: null, timestamp: null },
    TTL: 5 * 60 * 1000, // 5 minutes
};

/**
 * Hook to fetch active vouchers
 */
export const useVouchers = (limit = 6) => {
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const API_BASE_URL = getApiBaseUrl();

    useEffect(() => {
        let canceled = false;

        // Check cache
        const now = Date.now();
        if (cache.vouchers.data && cache.vouchers.timestamp &&
            (now - cache.vouchers.timestamp) < cache.TTL) {
            // Cache stores full data, slice when returning
            setVouchers(cache.vouchers.data.slice(0, limit));
            setLoading(false);
            return;
        }

        const fetchVouchers = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getActiveVouchers();
                if (canceled) return;

                // Normalize all data first (don't slice yet)
                const normalized = (Array.isArray(data) ? data : [])
                    .map((v) => ({
                        ...v,
                        imageUrl: normalizeVoucherImageUrl(v.imageUrl, API_BASE_URL),
                    }));

                // Update cache with full normalized data
                cache.vouchers.data = normalized;
                cache.vouchers.timestamp = now;

                // Slice only when setting state
                if (!canceled) {
                    setVouchers(normalized.slice(0, limit));
                }
            } catch (e) {
                console.error('Error fetching vouchers:', e);
                if (!canceled) {
                    setVouchers([]);
                    setError(e?.message || 'Không thể tải vouchers');
                }
            } finally {
                if (!canceled) setLoading(false);
            }
        };

        fetchVouchers();
        return () => { canceled = true; };
    }, [limit, API_BASE_URL]);

    return { vouchers, loading, error };
};

/**
 * Hook to fetch active promotions
 */
export const usePromotions = (limit = 6) => {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const API_BASE_URL = getApiBaseUrl();

    useEffect(() => {
        let canceled = false;

        // Check cache
        const now = Date.now();
        if (cache.promotions.data && cache.promotions.timestamp &&
            (now - cache.promotions.timestamp) < cache.TTL) {
            // Cache stores full data, slice when returning
            setPromotions(cache.promotions.data.slice(0, limit));
            setLoading(false);
            return;
        }

        const fetchPromotions = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getActivePromotions();
                if (canceled) return;

                // Normalize all data first (don't slice yet)
                const normalized = (Array.isArray(data) ? data : [])
                    .map((p) => ({
                        ...p,
                        imageUrl: normalizePromotionImageUrl(p.imageUrl, API_BASE_URL),
                    }));

                // Update cache with full normalized data
                cache.promotions.data = normalized;
                cache.promotions.timestamp = now;

                // Slice only when setting state
                if (!canceled) {
                    setPromotions(normalized.slice(0, limit));
                }
            } catch (e) {
                console.error('Error fetching promotions:', e);
                if (!canceled) {
                    setPromotions([]);
                    setError(e?.message || 'Không thể tải khuyến mãi');
                }
            } finally {
                if (!canceled) setLoading(false);
            }
        };

        fetchPromotions();
        return () => { canceled = true; };
    }, [limit, API_BASE_URL]);

    return { promotions, loading, error };
};

