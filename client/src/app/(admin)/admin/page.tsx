'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { formatCurrency } from '@/lib/utils';
import { Users, TrendingUp, CreditCard, Activity } from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';

// Dữ liệu giả cho biểu đồ (Sau này thay bằng API)
const chartData = [
  { name: 'T2', revenue: 4000000 },
  { name: 'T3', revenue: 3000000 },
  { name: 'T4', revenue: 2000000 },
  { name: 'T5', revenue: 2780000 },
  { name: 'T6', revenue: 1890000 },
  { name: 'T7', revenue: 2390000 },
  { name: 'CN', revenue: 3490000 },
];

export default function AdminDashboard() {
  
  // 1. Fetch dữ liệu thống kê
  const { data: stats, isLoading } = useQuery({
      queryKey: ['admin-stats'],
      queryFn: adminService.getDashboardStats,
  });

  if (isLoading) return <div className="p-8 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Tổng quan hệ thống</h1>
        <p className="text-slate-500">Chào mừng trở lại, Administrator.</p>
      </div>

      {/* Cards thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Tổng doanh thu" 
            value={formatCurrency(stats?.totalRevenue || 0)} 
            icon={TrendingUp} 
            color="text-green-600"
            bg="bg-green-50"
          />
          <StatCard 
            title="Tổng chủ cửa hàng" 
            value={stats?.totalUsers} 
            icon={Users} 
            color="text-blue-600"
            bg="bg-blue-50"
          />
          <StatCard 
            title="Gói đang hoạt động" 
            value={stats?.activeSubscriptions} 
            icon={CreditCard} 
            color="text-purple-600"
            bg="bg-purple-50"
          />
          <StatCard 
            title="Tăng trưởng tháng" 
            value={`+${stats?.growthRate}%`} 
            icon={Activity} 
            color="text-orange-600"
            bg="bg-orange-50"
          />
      </div>

      {/* Biểu đồ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Biểu đồ Doanh thu (Line Chart) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-4">Doanh thu hệ thống (7 ngày qua)</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} tickFormatter={(value) => `${value/1000000}M`} />
                        <Tooltip 
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                            formatter={(value: number) => formatCurrency(value)}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                    </LineChart>
                </ResponsiveContainer>
              </div>
          </div>

          {/* Biểu đồ phân bố User (Ví dụ Bar Chart) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
               <h3 className="font-semibold text-slate-800 mb-4">Người dùng mới đăng ký</h3>
               <div className="h-[300px] w-full flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    <p>Đang cập nhật biểu đồ...</p>
                    {/* Bạn có thể thêm BarChart tương tự ở đây */}
               </div>
          </div>
      </div>
    </div>
  );
}

// Component con hiển thị Card nhỏ
function StatCard({ title, value, icon: Icon, color, bg }: any) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${bg}`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">{title}</p>
                <h4 className="text-2xl font-bold text-slate-800 mt-1">{value}</h4>
            </div>
        </div>
    )
}