'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';

// Định nghĩa lại interface cho đầy đủ
export interface Owner {
  id: string;
  full_name: string;
  phone_number: string;
  is_active: boolean;
  created_at: string;
}

interface Props {
  onEdit: (owner: Owner) => void; // Callback khi bấm nút Sửa
}

export default function AccountOwnerTable({ onEdit }: Props) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch danh sách
  const { data: owners = [], isLoading } = useQuery<Owner[]>({
    queryKey: ['admin-owners'],
    queryFn: async () => (await api.get('/admin/owners')).data,
  });

  // Mutation Khóa/Mở khóa
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: boolean }) => {
      return api.put('/admin/owners/status', { ownerId: id, status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-owners'] });
      toast.success('Đã cập nhật trạng thái');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Lỗi'),
  });

  const filteredOwners = owners.filter(owner => 
    owner.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.phone_number.includes(searchTerm)
  );

  if (isLoading) return <div>Đang tải...</div>;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b">
        <input 
          type="text" 
          placeholder="Tìm kiếm..." 
          className="w-full max-w-sm px-4 py-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <table className="w-full">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tên</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">SĐT</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Trạng Thái</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Hành Động</th>
          </tr>
        </thead>
        <tbody>
          {filteredOwners.map((owner) => (
            <tr key={owner.id} className="border-b hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium">{owner.full_name}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{owner.phone_number}</td>
              <td className="px-6 py-4 text-sm">
                <span className={`px-2 py-1 rounded text-xs ${owner.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {owner.is_active ? 'Hoạt động' : 'Đã khóa'}
                </span>
              </td>
              <td className="px-6 py-4 text-sm space-x-2">
                {/* Nút Sửa: Gọi callback onEdit */}
                <button 
                  onClick={() => onEdit(owner)}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                >
                  Sửa
                </button>
                
                {/* Nút Khóa/Mở khóa */}
                <button 
                  onClick={() => {
                    if(confirm(`Xác nhận ${owner.is_active ? 'khóa' : 'mở khóa'} tài khoản này?`)) {
                      toggleStatusMutation.mutate({ id: owner.id, newStatus: !owner.is_active });
                    }
                  }}
                  className={`px-3 py-1 rounded text-white text-xs ${owner.is_active ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'}`}
                >
                  {owner.is_active ? 'Khóa' : 'Mở'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}