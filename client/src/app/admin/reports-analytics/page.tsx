'use client';

import ReportsChart from '@/components/admin/ReportsChart';

export default function ReportsAnalyticsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Báo Cáo & Phân Tích</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ReportsChart title="Doanh Thu Theo Tháng" type="revenue" />
        <ReportsChart title="Số Lượng Gói Đăng Ký" type="subscriptions" />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Phản Hồi Khách Hàng</h2>
        <p className="text-gray-600">Hiển thị dữ liệu phản hồi chi tiết tại đây...</p>
      </div>
    </div>
  );
}