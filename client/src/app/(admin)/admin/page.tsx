'use client';

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Dashboard Admin
      </h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Tổng Chủ Sở Hữu" value="150" trend="+12%" />
        <StatCard title="Tổng Doanh Thu" value="$45,231" trend="+8%" />
        <StatCard title="Gói Đăng Ký Hoạt Động" value="320" trend="+5%" />
        <StatCard title="Báo Cáo Mới" value="28" trend="+15%" />
      </div>

      {/* Welcome Message */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Chào mừng đến Admin Panel
        </h2>
        <p className="text-gray-600 mb-4">
          Sử dụng menu bên trái để quản lý tài khoản, xem báo cáo, quản lý gói đăng ký, 
          và cấu hình hệ thống.
        </p>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend }: { title: string; value: string; trend: string }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <p className="text-gray-600 text-sm font-medium">{title}</p>
      <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
      <p className="text-green-600 text-sm mt-2">{trend} so với tháng trước</p>
    </div>
  );
}