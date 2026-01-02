import api from '@/lib/axios';
import { Product } from '@/types';

export const ownerService = {
    // Nhập kho sản phẩm
    importStock: async (data: { product_id: string; quantity: number; importPrice: number; supplier?: string; }) => {
        return api.post('/owner/import', data);
    },
};