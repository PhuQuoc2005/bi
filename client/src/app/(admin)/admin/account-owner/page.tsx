'use client';

import { useState } from 'react';
import AccountOwnerTable, { Owner } from '@/components/admin/AccountOwnerTable'; // Import interface Owner
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AccountOwnerPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null); // Lưu owner đang sửa
  const queryClient = useQueryClient();

  // State form
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    password: ''
  });

  // 1. Hàm mở modal
  const handleOpenModal = (owner?: Owner) => {
    if (owner) {
      // Chế độ Edit
      setEditingOwner(owner);
      setFormData({
        full_name: owner.full_name,
        phone_number: owner.phone_number,
        password: '' // Không hiển thị mật khẩu cũ
      });
    } else {
      // Chế độ Create
      setEditingOwner(null);
      setFormData({ full_name: '', phone_number: '', password: '' });
    }
    setIsModalOpen(true);
  };

  // 2. Mutation chung (Tự check để gọi Create hay Update)
  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingOwner) {
        // Gọi API Update
        return api.put(`/admin/owners/${editingOwner.id}`, data);
      } else {
        // Gọi API Create
        return api.post('/admin/owners', data);
      }
    },
    onSuccess: () => {
      toast.success(editingOwner ? 'Cập nhật thành công!' : 'Tạo mới thành công!');
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-owners'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Quản Lý Tài Khoản Chủ Sở Hữu</h1>
        <Button 
          onClick={() => handleOpenModal()} 
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          + Thêm Tài Khoản
        </Button>
      </div>

      {/* Truyền hàm handleOpenModal xuống Table để nút "Sửa" gọi */}
      <AccountOwnerTable onEdit={handleOpenModal} />

      {/* --- MODAL (Dùng chung cho Thêm & Sửa) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingOwner ? 'Cập Nhật Thông Tin' : 'Thêm Chủ Sở Hữu Mới'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Họ và tên</Label>
                <Input
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Số điện thoại</Label>
                <Input
                  required
                  value={formData.phone_number}
                  onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  {editingOwner ? 'Mật khẩu mới (Để trống nếu không đổi)' : 'Mật khẩu'}
                </Label>
                <Input
                  type="password"
                  // Nếu là Edit thì không bắt buộc, nếu Create thì bắt buộc
                  required={!editingOwner}
                  minLength={6}
                  placeholder={editingOwner ? '********' : 'Nhập mật khẩu...'}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Hủy
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={submitMutation.isPending}
                >
                  {submitMutation.isPending ? 'Đang xử lý...' : (editingOwner ? 'Lưu Thay Đổi' : 'Tạo Mới')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}