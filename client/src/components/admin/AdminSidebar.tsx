'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: '📊' },
    { name: 'Quản Lý Tài Khoản', path: '/admin/account-owner', icon: '👤' },
    { name: 'Báo Cáo & Phân Tích', path: '/admin/reports-analytics', icon: '📈' },
    { name: 'Quản Lý Gói Đăng Ký', path: '/admin/subscription-plans', icon: '💳' },
    { name: 'Cấu Hình Hệ Thống', path: '/admin/system-config', icon: '⚙️' },
  ];

  return (
    <aside className={`${isOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 flex flex-col`}>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {isOpen && <h1 className="text-xl font-bold">BizFlow Admin</h1>}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-gray-800 rounded-lg"
        >
          ☰
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <span className="text-xl">{item.icon}</span>
            {isOpen && <span className="text-sm font-medium">{item.name}</span>}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      {isOpen && (
        <div className="p-4 border-t border-gray-700">
          <button className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium">
            Đăng Xuất
          </button>
        </div>
      )}
    </aside>
  );
}