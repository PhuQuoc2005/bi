'use client';

import { useState } from 'react';

export default function SystemConfigForm({ title }: { title: string }) {
  const [config, setConfig] = useState({
    setting1: '',
    setting2: '',
    setting3: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    alert('Cấu hình đã được lưu!');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cài Đặt 1</label>
          <input
            type="text"
            name="setting1"
            value={config.setting1}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập giá trị..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cài Đặt 2</label>
          <input
            type="text"
            name="setting2"
            value={config.setting2}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập giá trị..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cài Đặt 3</label>
          <input
            type="text"
            name="setting3"
            value={config.setting3}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập giá trị..."
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
        >
          Lưu Cấu Hình
        </button>
      </div>
    </div>
  );
}