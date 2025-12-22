'use client';

import React, { useEffect, useState } from 'react';
import { Search, Filter, Printer, Plus, MoreVertical, Edit, Trash2, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { productService, Product } from '@/lib/product';

// SỬ DỤNG NAMED EXPORT ĐỂ KHỚP VỚI page.tsx
export const InventoryManager = () => {
    // --- PHẦN LOGIC (STATE & API) ---
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    
    // State cho Modal (Thêm/Sửa)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<Product>({
        name: '', category: '', price: 0, stock: 0, images: ''
    });

    // 1. Load dữ liệu từ API
    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await productService.getAll();
            setProducts(data);
        } catch (err) {
            console.error('Lỗi tải dữ liệu:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // 2. Xử lý Submit Form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingProduct && editingProduct.id) {
                await productService.update(editingProduct.id, formData);
            } else {
                await productService.create(formData);
            }
            setIsModalOpen(false);
            setEditingProduct(null);
            resetForm();
            fetchProducts();
        } catch (err) {
            alert('Có lỗi xảy ra khi lưu sản phẩm');
        }
    };

    // 3. Xử lý Xóa
    const handleDelete = async (id: number) => {
        if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
            try {
                await productService.delete(id);
                fetchProducts();
            } catch (err) {
                alert('Lỗi khi xóa sản phẩm');
            }
        }
    };

    const resetForm = () => {
        setFormData({ name: '', category: '', price: 0, stock: 0, images: '' });
    };

    const openCreateModal = () => {
        setEditingProduct(null);
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setFormData(product);
        setIsModalOpen(true);
    };

    // Hàm helper hiển thị màu trạng thái
    const getStatusColor = (stock: number) => {
        if (stock === 0) return 'bg-red-100 text-red-700 border-red-200';
        if (stock < 10) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        return 'bg-green-100 text-green-700 border-green-200';
    };

    // --- PHẦN GIAO DIỆN (UI) ---
    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Quản lý kho hàng</h2>
                <div className="flex gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-50 shadow-sm transition-all">
                        <Printer size={18} /> Xuất kho
                    </button>
                    <button 
                        onClick={openCreateModal}
                        className="flex-1 md:flex-none flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md shadow-blue-200 transition-all"
                    >
                        <Plus size={18} /> Nhập hàng
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Search Bar */}
                <div className="p-4 border-b border-slate-100 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" placeholder="Tìm sản phẩm..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"><Filter size={18} className="text-slate-600" /></button>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Mã SP</th>
                                <th className="p-4">Tên sản phẩm</th>
                                <th className="p-4">Danh mục</th>
                                <th className="p-4 text-right">Giá bán</th>
                                <th className="p-4 text-center">Tồn kho</th>
                                <th className="p-4 text-center">Trạng thái</th>
                                <th className="p-4 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={7} className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td></tr>
                            ) : products.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-slate-500">Chưa có sản phẩm nào.</td></tr>
                            ) : (
                                products.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 text-slate-500 font-mono">#{p.id}</td>
                                        <td className="p-4 font-medium text-slate-800">{p.name}</td>
                                        <td className="p-4 text-slate-600">{p.category}</td>
                                        <td className="p-4 text-right font-medium text-slate-700">
                                            {formatCurrency(p.price)}
                                        </td>
                                        <td className="p-4 text-center font-bold">{p.stock}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(p.stock)}`}>
                                                {p.stock === 0 ? 'Hết hàng' : p.stock < 10 ? 'Sắp hết' : 'Còn hàng'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => openEditModal(p)}
                                                    className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition" 
                                                    title="Sửa"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => p.id && handleDelete(p.id)}
                                                    className="p-1.5 hover:bg-red-50 text-red-600 rounded transition"
                                                    title="Xóa"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Form (Add/Edit) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-800">
                                {editingProduct ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tên sản phẩm</label>
                                <input 
                                    type="text" 
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    required
                                    placeholder="Nhập tên sản phẩm..."
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Giá bán (VNĐ)</label>
                                    <input 
                                        type="number" 
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.price}
                                        onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                                        required
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tồn kho</label>
                                    <input 
                                        type="number" 
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.stock}
                                        onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
                                        required
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục</label>
                                <input 
                                    type="text" 
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.category}
                                    onChange={e => setFormData({...formData, category: e.target.value})}
                                    placeholder="Ví dụ: Điện tử, Gia dụng..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition"
                                >
                                    Hủy bỏ
                                </button>
                                <button 
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium shadow-md shadow-blue-200 transition"
                                >
                                    {editingProduct ? 'Lưu thay đổi' : 'Tạo mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};