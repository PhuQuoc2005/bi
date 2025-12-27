// src/services/admin.service.ts
import api from '@/lib/axios';

export interface DashboardStats {
    totalRevenue: number;
    totalUsers: number;
    activeSubscriptions: number;
    growthRate: number;
}

export const adminService = {
    // Lấy thống kê tổng quan (Dashboard)
    getDashboardStats: async (): Promise<DashboardStats> => {
        // Tạm thời trả về dữ liệu giả để test giao diện (nếu chưa có API backend)
        // Khi có API thì đổi thành: const res = await api.get('/admin/stats'); return res.data;
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    totalRevenue: 150000000, // 150 triệu
                    totalUsers: 45,
                    activeSubscriptions: 12,
                    growthRate: 15.5
                });
            }, 1000);
        });
    },

    // Lấy danh sách người dùng (Chủ cửa hàng)
    getOwners: async () => {
        const response = await api.get('/admin/users?role=OWNER');
        return response.data;
    }
};