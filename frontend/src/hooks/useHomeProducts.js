import { useState, useEffect, useMemo } from 'react';
import { getApiBaseUrl, mapProductToCard, sortAndSlice } from '../services/utils';
import { PRODUCT_LIMITS, RATING_THRESHOLD } from '../services/constants';

// Cache for API responses (simple in-memory cache)
const productsCache = {
    data: null,
    timestamp: null,
    TTL: 5 * 60 * 1000, // 5 minutes
};

/**
 * Hook to fetch active products for Home page
 * Returns products mapped to card format
 */
export const useHomeProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const API_BASE_URL = getApiBaseUrl();

    useEffect(() => {
        let canceled = false;

        // Check cache first
        const now = Date.now();
        if (productsCache.data && productsCache.timestamp &&
            (now - productsCache.timestamp) < productsCache.TTL) {
            setProducts(productsCache.data);
            setLoading(false);
            return;
        }

        const fetchProducts = async () => {
            setLoading(true);
            setError('');
            try {
                const resp = await fetch(`${API_BASE_URL}/products/active`, {
                    headers: {
                        'Cache-Control': 'max-age=300', // 5 minutes
                    },
                });
                const data = await resp.json().catch(() => ({}));
                if (canceled) return;

                if (!resp.ok) {
                    throw new Error(data?.message || 'Không thể tải sản phẩm');
                }

                const rawProducts = Array.isArray(data?.result) ? data.result :
                    Array.isArray(data) ? data : [];

                const normalized = rawProducts
                    .map((p) => mapProductToCard(p, API_BASE_URL))
                    .filter(Boolean);

                // Update cache
                productsCache.data = normalized;
                productsCache.timestamp = now;

                setProducts(normalized);
            } catch (err) {
                if (!canceled) {
                    setProducts([]);
                    setError(err?.message || 'Không thể tải sản phẩm');
                }
            } finally {
                if (!canceled) setLoading(false);
            }
        };

        fetchProducts();
        return () => { canceled = true; };
    }, [API_BASE_URL]);

    return { products, loading, error };
};

/**
 * Hook to get categorized products
 * Memoized to prevent recalculation on every render
 */
export const useCategorizedProducts = (allProducts) => {
    return useMemo(() => {
        // Ensure allProducts is an array
        const products = Array.isArray(allProducts) ? allProducts : [];
        
        const promotional = sortAndSlice(
            products.filter((p) => p && (p.discount ?? 0) > 0),
            (p) => p.discount || 0,
            PRODUCT_LIMITS.PROMOTIONAL,
        );

        const favorite = sortAndSlice(
            products.filter((p) => p && (p.averageRating ?? 0) >= RATING_THRESHOLD),
            (p) => p.quantitySold || 0,
            PRODUCT_LIMITS.FAVORITE,
        );

        const bestSeller = sortAndSlice(
            products.filter((p) => p), // Filter out null/undefined
            (p) => p.quantitySold || 0,
            PRODUCT_LIMITS.BEST_SELLER,
        );

        const newest = sortAndSlice(
            products.filter((p) => p), // Filter out null/undefined
            (p) => (p.updatedAt ? new Date(p.updatedAt).getTime() : 0),
            PRODUCT_LIMITS.NEWEST,
        );

        return { promotional, favorite, bestSeller, newest };
    }, [allProducts]);
};

