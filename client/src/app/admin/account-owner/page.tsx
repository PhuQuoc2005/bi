'use client';

import AccountOwnerTable from '@/components/admin/AccountOwnerTable';

export default function AccountOwnerPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Quản Lý Tài Khoản Chủ Sở Hữu</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Thêm Tài Khoản
        </button>
      </div>

      <AccountOwnerTable />
    </div>
  );
}