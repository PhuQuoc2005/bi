'use client';

import SubscriptionPlanCard from '@/components/admin/SubscriptionPlanCard';

export default function SubscriptionPlansPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Quản Lý Gói Đăng Ký</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Tạo Gói Mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SubscriptionPlanCard name="Gói Cơ Bản" price="$9.99" features={['Tính năng 1', 'Tính năng 2']} />
        <SubscriptionPlanCard name="Gói Chuyên Nghiệp" price="$29.99" features={['Tính năng 1', 'Tính năng 2', 'Tính năng 3']} />
        <SubscriptionPlanCard name="Gói Enterprise" price="$99.99" features={['Tất cả tính năng']} />
      </div>
    </div>
  );
}