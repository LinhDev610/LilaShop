import { useState, useEffect, useMemo } from 'react';
import { getApiBaseUrl } from '../services/utils';
import { normalizeMediaUrl } from '../services/productUtils';

// Cache for banners
const bannersCache = {
    data: null,
    timestamp: null,
    TTL: 10 * 60 * 1000, // 10 minutes
};

/**
 * Hook to fetch active banners with full banner objects
 */
export const useBanners = () => {
    const [banners, setBanners] = useState([]);
    const API_BASE_URL = getApiBaseUrl();

    useEffect(() => {
        let canceled = false;

        // Check cache first
        const now = Date.now();
        if (bannersCache.data && bannersCache.timestamp &&
            (now - bannersCache.timestamp) < bannersCache.TTL) {
            setBanners(bannersCache.data);
            return;
        }

        const fetchBanners = async () => {
            try {
                const resp = await fetch(`${API_BASE_URL}/banners/active`, {
                    headers: {
                        'Cache-Control': 'max-age=600', // 10 minutes
                    },
                });
                if (!resp.ok || canceled) return;
                const data = await resp.json().catch(() => ({}));

                const bannerObjects = (data?.result || [])
                    .filter((b) => b?.imageUrl)
                    .map((b) => ({
                        ...b,
                        imageUrl: normalizeMediaUrl(b.imageUrl, API_BASE_URL),
                    }));

                // Update cache
                bannersCache.data = bannerObjects;
                bannersCache.timestamp = now;

                if (!canceled) setBanners(bannerObjects);
            } catch (e) {
                // Silent fail for public home
            }
        };
        fetchBanners();
        return () => { canceled = true; };
    }, [API_BASE_URL]);

    return banners;
};

export const useCategorizedBanners = (allBanners) => {
    return useMemo(() => {
        const hero = allBanners
            .filter((b) => (b.orderIndex ?? 0) < 100)
            .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
            .map((b) => b.imageUrl);

        const promo = allBanners
            .filter((b) => {
                const idx = b.orderIndex ?? 0;
                return idx >= 100 && idx < 200;
            })
            .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
            .slice(0, 3)
            .map((b) => ({
                image: b.imageUrl,
                alt: b.title || 'Promo banner',
                href: b.linkUrl || '#',
            }));

        const bottom = allBanners
            .filter((b) => {
                const idx = b.orderIndex ?? 0;
                return idx >= 200 && idx < 300;
            })
            .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
            .slice(0, 3)
            .map((b, idx) => ({
                image: b.imageUrl,
                alt: b.title || `Banner ${idx + 1}`,
                href: b.linkUrl || '#',
                variant: (idx % 3) + 1, // 1, 2, or 3
            }));

        return { hero, promo, bottom };
    }, [allBanners]);
};
