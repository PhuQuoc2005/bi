'use client';

import SystemConfigForm from '@/components/admin/SystemConfigForm';

export default function SystemConfigPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Cấu Hình Hệ Thống</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SystemConfigForm title="Cấu Hình Cơ Bản" />
        <SystemConfigForm title="Mẫu Báo Cáo Tài Chính" />
      </div>
    </div>
  );
}