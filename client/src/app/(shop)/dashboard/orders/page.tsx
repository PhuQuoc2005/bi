'use client';

import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/services/order.service';
import { formatCurrency } from '@/lib/utils';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns'; // Bạn có thể cần cài: npm install date-fns
import { Loader2 } from 'lucide-react';

export default function OrdersPage() {
  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['orders'],
    queryFn: orderService.getAll,
  });

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  if (isError) return <div className="text-red-500 p-4">Không thể tải danh sách đơn hàng.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Lịch sử đơn hàng</h1>
      </div>

      <div className="border rounded-md bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã đơn</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Loại đơn</TableHead>
              <TableHead>Thanh toán</TableHead>
              <TableHead className="text-right">Tổng tiền</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Chưa có đơn hàng nào.
                </TableCell>
              </TableRow>
            ) : (
              orders?.map((order) => (
                <TableRow key={order.id} className="cursor-pointer hover:bg-slate-50">
                  <TableCell className="font-mono text-xs font-medium">
                    {order.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="font-medium">
                    {order.customer_name || 'Khách lẻ'}
                  </TableCell>
                  <TableCell>
                     <Badge variant="outline">
                        {order.order_type === 'AT_COUNTER' ? 'Tại quầy' : 'Online'}
                     </Badge>
                  </TableCell>
                  <TableCell>
                    {order.payment_method === 'CASH' ? 'Tiền mặt' : 
                     order.payment_method === 'TRANSFER' ? 'Chuyển khoản' : 'Ghi nợ'}
                  </TableCell>
                  <TableCell className="text-right font-bold text-blue-600">
                    {formatCurrency(Number(order.total_price))}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {/* Nếu chưa cài date-fns thì dùng: new Date(order.created_at).toLocaleDateString() */}
                    {order.created_at ? format(new Date(order.created_at), 'dd/MM/yyyy HH:mm') : '-'}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                    }`}>
                        {order.status === 'COMPLETED' ? 'Hoàn thành' : order.status}
                    </span>
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