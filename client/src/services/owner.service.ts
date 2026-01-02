import api from '@/lib/axios';
import { Product } from '@/types';

export const ownerService = {
    // Lấy tất cả đơn vị tính (UoM)
    getAllUoms: async () => {
        const response = await api.get('/owner/uoms/all');
        return response.data;
    },

    // Lấy đơn vị tính của sản phẩm
    getProductUoms: async (productId: String) => {
        const response = await api.get(`/owner/${productId}/uoms`);
        return response.data;
    },

    getStoreUoms: async () => {
        const response = await api.get('/owner/uoms/store');
        return response.data;
    },

    // Nhập kho sản phẩm
    importStock: async (data: { product_id: string; quantity: number; importPrice: number; supplier?: string; }) => {
        return api.post('/owner/import', data);
    },
};