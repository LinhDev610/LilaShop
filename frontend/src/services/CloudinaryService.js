import { apiRequest } from './api';
import { API_ROUTES, CLOUDINARY_UPLOAD_URL, CLOUDINARY_FOLDERS } from './constants';

/**
 * Upload file directly to Cloudinary using backend signature
 * @param {File} file - The file to upload
 * @param {string} folder - The folder to upload to (default: 'product_media')
 * @returns {Promise<string>} - The secure URL of the uploaded file
 */
export const uploadToCloudinary = async (file, folder = CLOUDINARY_FOLDERS.PRODUCT) => {
    try {
        // 1. Get signature, api_key, cloud_name từ backend
        const timestamp = Math.round((new Date()).getTime() / 1000);
        const paramsToSign = {
            folder,
            timestamp,
        };

        // Xin chữ ký cho định dạng webp
        if (file.type.startsWith('image/')) {
            paramsToSign.format = 'webp';
        }

        // Gọi backend để lấy chữ ký, api_key, cloud_name
        const { ok, data, message } = await apiRequest('/media/signature', {
            method: 'POST',
            body: paramsToSign,
        });

        if (!ok || !data) {
            throw new Error(message || 'Failed to get upload signature');
        }

        const { signature, api_key, cloud_name } = data.result || data;

        // 2. Upload to Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', api_key);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
        formData.append('folder', folder);
        // Gửi yêu cầu upload ép về định dạng webp
        if (file.type.startsWith('image/')) {
            formData.append('format', 'webp');
        }

        const uploadResponse = await fetch(`${CLOUDINARY_UPLOAD_URL}/${cloud_name}/auto/upload`, {
            method: 'POST',
            body: formData
        });

        if (!uploadResponse.ok) {
            const err = await uploadResponse.json();
            throw new Error(err.error?.message || 'Cloudinary upload failed');
        }

        const uploadResult = await uploadResponse.json();
        return uploadResult.secure_url;

    } catch (error) {
        console.error('Cloudinary Upload Error:', error);
        throw error;
    }
};




/**
 * Upload multiple files in parallel
 * @param {FileList | File[]} files - List of files to upload
 * @param {string} folder - Cloudinary folder (default: 'product_media')
 * @returns {Promise<string[]>} - List of secure_urls
 */
export const uploadFilesParallel = async (files, folder = CLOUDINARY_FOLDERS.PRODUCT) => {
    if (!files || files.length === 0) return [];

    const fileArray = Array.from(files);

    try {
        const uploadPromises = fileArray.map(file => uploadToCloudinary(file, folder));
        const urls = await Promise.all(uploadPromises);
        return urls.filter(url => url !== null);
    } catch (error) {
        console.error('Parallel upload failed:', error);
        throw error;
    }
};

// Specific Upload Helpers
export const uploadProductMedia = async (files) => {
    return uploadFilesParallel(files, CLOUDINARY_FOLDERS.PRODUCT);
};

export const uploadBannerMedia = async (files) => {
    return uploadFilesParallel(files, CLOUDINARY_FOLDERS.BANNER);
};

export const uploadVoucherMedia = async (files) => {
    return uploadFilesParallel(files, CLOUDINARY_FOLDERS.VOUCHER);
};

export const uploadPromotionMedia = async (files) => {
    return uploadFilesParallel(files, CLOUDINARY_FOLDERS.PROMOTION);
};

export const uploadProfileMedia = async (file) => {
    if (!file) return null;
    const urls = await uploadFilesParallel([file], CLOUDINARY_FOLDERS.PROFILE);
    return urls[0] || null;
};

export const uploadContentMedia = async (files) => {
    return uploadFilesParallel(files, CLOUDINARY_FOLDERS.CONTENT);
};

export default {
    uploadToCloudinary,
    uploadFilesParallel,
    uploadProductMedia,
    uploadBannerMedia,
    uploadVoucherMedia,
    uploadPromotionMedia,
    uploadProfileMedia,
    uploadContentMedia
};
