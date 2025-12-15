'use client';

import React, { useState, useEffect } from 'react';
import { Menu, Mic, Bell, FileText, Save, Users } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Dashboard } from '@/components/features/Dashboard';
import { POS } from '@/components/features/POS';
import { InventoryManager } from '@/components/features/Inventory';
import { AIAssistant } from '@/components/features/AIAssistant';
import { CustomerManager } from '@/components/features/CustomerManager';
import { PRODUCTS, CUSTOMERS } from '@/lib/constants';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [notification, setNotification] = useState<any>(null);

  useEffect(() => {
    const checkMobile = () => {
        const mobile = window.innerWidth < 1024;
        setIsMobile(mobile);
        if (mobile) setIsCollapsed(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) return prev.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) return { ...item, qty: Math.max(1, item.qty + delta) };
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = (isDebt: boolean) => {
    setNotification({
      type: 'success',
      message: isDebt ? 'Đã ghi nợ thành công!' : 'Thanh toán thành công!'
    });
    setCart([]);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAIProcess = (data: any) => {
    const customer = CUSTOMERS.find(c => c.id === data.customerId);
    const productsToAdd = data.items.map((i: any) => {
      const prod = PRODUCTS.find(p => p.id === i.productId);
      return { ...prod, qty: i.qty };
    });
    setCart(productsToAdd);
    setNotification({ type: 'info', message: `AI: Đã tạo đơn nháp cho ${customer?.name}` });
    setTimeout(() => {
        setNotification(null);
        setActiveTab('pos');
    }, 1500);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMobile={isMobile}
        isOpen={isMobileNavOpen}
        setIsOpen={setIsMobileNavOpen}
        isCollapsed={isCollapsed}
        toggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-20 shadow-sm">
          <div className="flex items-center gap-4">
            {isMobile && (
              <button onClick={() => setIsMobileNavOpen(true)} className="p-2 -ml-2 hover:bg-slate-100 rounded-lg text-slate-600">
                <Menu size={24} />
              </button>
            )}
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              {activeTab === 'dashboard' && 'Tổng quan'}
              {activeTab === 'pos' && 'Bán hàng tại quầy'}
              {activeTab === 'products' && 'Quản lý kho & Vật tư'}
              {activeTab === 'customers' && 'Công nợ & Khách hàng'}
              {activeTab === 'ai_assistant' && 'Trợ lý ảo'}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveTab('ai_assistant')} className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all active:scale-95">
                <Mic size={16} /> <span>Ra lệnh giọng nói</span>
            </button>
            <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>
            <button className="relative p-2 hover:bg-slate-100 rounded-full text-slate-500">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-slate-50/50">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'pos' && <POS addToCart={addToCart} cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} checkout={handleCheckout} isMobile={isMobile} />}
          {activeTab === 'products' && <InventoryManager />}
          {activeTab === 'customers' && <CustomerManager />}
          {activeTab === 'ai_assistant' && <AIAssistant onProcessCommand={handleAIProcess} />}
          {activeTab === 'reports' && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center animate-fade-in">
              <div className="w-24 h-24 bg-blue-50 text-blue-200 rounded-full flex items-center justify-center mb-6"><FileText size={48} /></div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">Báo cáo chuẩn Thông tư 88</h3>
              <p className="max-w-md mx-auto mb-6">Tính năng đang được phát triển...</p>
            </div>
          )}
        </main>

        {isMobile && activeTab !== 'ai_assistant' && activeTab !== 'pos' && (
             <button onClick={() => setActiveTab('ai_assistant')} className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center z-50 animate-bounce-slow">
                <Mic size={28} />
             </button>
        )}

        {notification && (
            <div className={`fixed top-20 right-4 p-4 rounded-xl shadow-xl border-l-4 z-50 animate-slide-in flex items-center gap-3 bg-white max-w-sm ${notification.type === 'success' ? 'border-green-500' : 'border-blue-500'}`}>
                <div className={`p-2 rounded-full flex-shrink-0 ${notification.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                    {notification.type === 'success' ? <Save size={20} /> : <Users size={20} />}
                </div>
                <div>
                    <h4 className="font-bold text-sm text-slate-800">{notification.type === 'success' ? 'Thành công' : 'Thông báo'}</h4>
                    <p className="text-sm text-slate-600 leading-snug">{notification.message}</p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}