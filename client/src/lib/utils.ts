import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Hàm này dùng để merge class Tailwind (Mặc định của Shadcn)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// BẠN CẦN THÊM HÀM NÀY:
export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '0 ₫';
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('vi-VN');
}