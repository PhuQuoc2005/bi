// client/src/app/(shop)/dashboard/inventory/page.tsx
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import { Button } from '@/components/ui/button';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"; 
import { Plus, Trash2, Edit } from 'lucide-react';
// import { formatCurrency } from '@/lib/utils'; // Hãy dùng nếu đã có

export default function InventoryPage() {
  const queryClient = useQueryClient();

  const { data: products = [], isLoading, isError } = useQuery({ // Mặc định products = []
    queryKey: ['products'],
    queryFn: productService.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: productService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      alert('Đã xóa sản phẩm');
    }
  });

  const handleDelete = (id: string) => {
    if (confirm('Bạn chắc chắn muốn xóa?')) {
      deleteMutation.mutate(id);
    }
  }

  if (isLoading) return <div className="p-4">Đang tải dữ liệu kho...</div>;
  if (isError) return <div className="p-4 text-red-500">Lỗi khi tải dữ liệu!</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý kho hàng</h1>
        <Button className="flex items-center gap-2">
          <Plus size={16} /> Thêm sản phẩm
        </Button>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên sản phẩm</TableHead>
              <TableHead>Mã vạch</TableHead>
              <TableHead className="text-right">Giá bán</TableHead>
              <TableHead className="text-right">Tồn kho</TableHead>
              <TableHead className="text-right">Đơn vị</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Sử dụng check độ dài an toàn */}
            {(!products || products.length === 0) ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Chưa có sản phẩm nào.
                    </TableCell>
                </TableRow>
            ) : (
                // Đã đảm bảo products là mảng nhờ gán mặc định [] ở useQuery và logic service
                products.map((product) => (
                <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    {/* SỬA: dùng product.code thay vì barcode */}
                    <TableCell>{product.code || '---'}</TableCell> 
                    
                    <TableCell className="text-right font-bold text-blue-600">
                        {(product.price || 0).toLocaleString('vi-VN')} ₫
                    </TableCell>

                    {/* SỬA: dùng product.stock thay vì stockQuantity */}
                    <TableCell className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                        (product.stock || 0) > 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                        {product.stock || 0}
                    </span>
                    </TableCell>

                    <TableCell className="text-right text-gray-600">
                        {product.unit || 'Cái'}
                    </TableCell>
                    
                    <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon">
                        <Edit size={16} />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(product.id)}>
                        <Trash2 size={16} />
                    </Button>
                    </TableCell>
                </TableRow>
                ))
            )}
            </TableBody>
        </Table>
      </div>
    </div>
  );
}