import React, { useState } from 'react';
import axios from 'axios';
import { Bot, Send, AlertCircle, CheckCircle, Package, Loader2 } from 'lucide-react';

const AIOrderCreator = () => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Hàm gọi API AI
  const handleAnalyze = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      // Lấy token từ localStorage (hoặc nơi bạn lưu token đăng nhập)
      const token = localStorage.getItem('accessToken'); 
      console.log("Token lấy được là:", token);
      console.log("Dữ liệu login trả về:", data);

      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        console.log("Đã lưu accessToken thành công!");
    } else if (data.token) { // Trường hợp backend đặt tên là token
        localStorage.setItem('accessToken', data.token);
        console.log("Đã lưu token thành công (từ biến data.token)!");
    } else {
        console.error("KHÔNG TÌM THẤY TOKEN TRONG DATA!", data);
    }

      const response = await axios.post(
        'http://localhost:5000/api/orders/ai/draft', // URL Backend của bạn
        { message },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Gửi kèm Token xác thực
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setResult(response.data.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Lỗi kết nối tới Server AI');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md">
      {/* --- HEADER --- */}
      <div className="flex items-center gap-2 mb-6 text-blue-600">
        <Bot size={32} />
        <h2 className="text-2xl font-bold">Trợ lý tạo đơn AI</h2>
      </div>

      {/* --- INPUT AREA --- */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nhập yêu cầu (Ví dụ: "Lấy 2 cái áo polo và 1 iphone 15")
        </label>
        <div className="relative">
          <textarea
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            rows="3"
            placeholder="Gõ nội dung đơn hàng vào đây..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAnalyze();
              }
            }}
          />
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !message.trim()}
            className="absolute bottom-3 right-3 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            <span className="font-medium">Phân tích</span>
          </button>
        </div>
        {error && (
          <div className="mt-2 text-red-500 flex items-center gap-1 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}
      </div>

      {/* --- RESULT AREA --- */}
      {result && (
        <div className="animate-fade-in-up">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            {/* Thông tin khách hàng */}
            <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200">
              <div>
                <span className="text-gray-500 text-sm block">Khách hàng phát hiện:</span>
                <div className="font-semibold text-lg flex items-center gap-2">
                  {result.customer.name || "Khách lẻ (Chưa xác định)"}
                  {result.customer.found ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">Đã khớp DB</span>
                  ) : (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full border border-orange-200">Chưa khớp</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-gray-500 text-sm block">Tổng dự kiến:</span>
                <span className="text-xl font-bold text-blue-600">
                  {result.estimated_total.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            {/* Danh sách sản phẩm */}
            <h3 className="font-medium mb-3 text-gray-700">Chi tiết đơn hàng:</h3>
            <div className="space-y-3">
              {result.items.map((item, index) => (
                <div 
                  key={index} 
                  className={`flex items-center p-3 rounded-lg border ${
                    item.found ? 'bg-white border-gray-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  {/* Icon ảnh sản phẩm */}
                  <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center mr-4 overflow-hidden flex-shrink-0">
                     {item.image ? (
                        <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                     ) : (
                        <Package className="text-gray-400" />
                     )}
                  </div>

                  {/* Thông tin chi tiết */}
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className={`font-medium ${item.found ? 'text-gray-900' : 'text-red-600'}`}>
                        {item.product_name}
                      </h4>
                      <div className="font-medium">
                        {item.found 
                          ? `${item.total.toLocaleString('vi-VN')} đ` 
                          : <span className="text-xs text-red-500 italic">Không tìm thấy giá</span>
                        }
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <div className="flex gap-4">
                        <span>SL: <b>{item.quantity} {item.unit}</b></span>
                        {item.found && <span>Đơn giá: {item.price.toLocaleString('vi-VN')} đ</span>}
                      </div>
                      
                      {/* Trạng thái kho */}
                      <div>
                        {item.found ? (
                          <span className="flex items-center gap-1 text-green-600 text-xs">
                            <CheckCircle size={14} /> Còn {item.stock_available} tồn
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 text-xs font-medium">
                            <AlertCircle size={14} /> Không tìm thấy trong kho
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setResult(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Hủy bỏ
              </button>
              <button className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm transition-colors">
                Xác nhận tạo đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIOrderCreator;