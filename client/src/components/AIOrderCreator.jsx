import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/axios';
import { 
  Bot, AlertCircle, Loader2, Mic, MicOff, 
  Calculator, X, RefreshCw, ShoppingCart, User, Package, 
  Trash2, Plus, Save, Edit2, Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// --- COMPONENT VISUALIZER (SÓNG ÂM) ---
const AudioVisualizer = ({ isRecording }) => {
  if (!isRecording) return null;
  return (
    <div className="flex items-center gap-1 h-5 px-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="w-1 bg-white rounded-full animate-pulse"
           style={{ height: '60%', animationDuration: `${0.5 + i * 0.1}s`, animationIterationCount: 'infinite' }} />
      ))}
    </div>
  );
};

const AIOrderCreator = () => {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('idle'); 
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // Dữ liệu đơn hàng (Editable)
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const textareaRef = useRef(null);

  // Auto-scroll textarea
  useEffect(() => {
    if (textareaRef.current) textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
  }, [transcript]);

  // --- 1. LOGIC GHI ÂM (Giữ nguyên) ---
  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await handleTranscribe(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setStatus('recording');
    } catch (err) {
      setError("Không thể truy cập Micro. Vui lòng cấp quyền.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // --- 2. DỊCH GIỌNG NÓI ---
  const handleTranscribe = async (audioBlob) => {
    setStatus('transcribing');
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await api.post('/orders/ai/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data && response.data.text) {
        setTranscript(prev => prev + (prev ? ' ' : '') + response.data.text);
        setStatus('idle');
      }
    } catch (err) {
      setError("Lỗi dịch giọng nói. Kiểm tra kết nối.");
      setStatus('idle');
    }
  };

  // --- 3. PHÂN TÍCH ĐƠN HÀNG ---
  const handleAnalyze = async () => {
    if (!transcript.trim()) return;
    setStatus('analyzing');
    setResult(null);
    setError('');
    
    try {
      const response = await api.post('/orders/ai/draft', { message: transcript });
      if (response.data.success) {
        setResult(response.data.data);
        setStatus('done');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi xử lý AI');
      setStatus('idle');
    }
  };

  const handleReset = () => {
    setTranscript('');
    setError('');
    setResult(null);
    setStatus('idle');
  };

  // --- 4. CÁC TÍNH NĂNG CHỈNH SỬA (MỚI) ---
  
  // Cập nhật giá trị 1 dòng (Số lượng, Giá, Tên...)
  const updateItem = (index, field, value) => {
    const updatedItems = [...result.items];
    const item = updatedItems[index];

    // Cập nhật field
    item[field] = value;

    // Logic tính toán lại
    if (field === 'quantity' || field === 'price') {
       // Ép kiểu số để tính toán
       const qty = parseFloat(item.quantity) || 0;
       const price = parseFloat(item.price) || 0;
       item.total = qty * price;
    }

    // Tính lại tổng tiền cả đơn
    const newTotal = updatedItems.reduce((sum, i) => sum + (i.total || 0), 0);
    
    setResult({ 
        ...result, 
        items: updatedItems, 
        estimated_total: newTotal 
    });
  };

  // Xóa món hàng
  const removeItem = (index) => {
    const updatedItems = result.items.filter((_, i) => i !== index);
    const newTotal = updatedItems.reduce((sum, i) => sum + (i.total || 0), 0);
    setResult({ ...result, items: updatedItems, estimated_total: newTotal });
  };

  // Thêm món hàng thủ công (Dòng trống)
  const addItem = () => {
    const newItem = {
        product_name: "", 
        ai_product_name: "Món thêm mới",
        found: false, // Mặc định là chưa tìm thấy trong kho (cần nhập tay)
        quantity: 1,
        unit: "cái",
        price: 0,
        total: 0,
        isNew: true // Cờ đánh dấu dòng mới thêm
    };
    
    const updatedItems = [...result.items, newItem];
    setResult({ ...result, items: updatedItems });
  };

  // Hàm tạo đơn cuối cùng (Gửi lên Server lưu DB)
  const handleCreateOrder = async () => {
      // Logic gọi API tạo đơn thật ở đây
      alert(`Đã tạo đơn hàng trị giá: ${result.estimated_total.toLocaleString()} đ \n(Gửi ${result.items.length} món lên server...)`);
      // await api.post('/orders', { ...result });
      handleReset();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      
      {/* --- PHẦN 1: NHẬP LIỆU (Voice/Text) --- */}
      <Card className={`border-2 transition-all ${isRecording ? 'border-red-400 shadow-lg shadow-red-100' : 'border-gray-200'}`}>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-3 pt-3 bg-slate-50 rounded-t-xl">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-blue-200 shadow-md">
                <Bot size={22} />
             </div>
             <div>
               <CardTitle className="text-lg text-gray-800">Trợ lý AI nhập đơn</CardTitle>
               <p className="text-xs text-gray-500">Giọng nói hoặc văn bản</p>
             </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleReset} title="Làm mới">
             <RefreshCw size={18} className="text-gray-500"/>
          </Button>
        </CardHeader>
        
        <CardContent className="p-0">
           <div className="relative">
             <textarea
                ref={textareaRef}
                className="w-full min-h-[100px] p-5 resize-none outline-none text-lg text-gray-700 bg-white placeholder:text-gray-300"
                placeholder={isRecording ? "..." : "Ví dụ: Lấy 5 bao xi măng Hà Tiên, 2 thùng sơn Dulux trắng..."}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                disabled={status === 'analyzing' || status === 'transcribing'}
             />
             
             {/* Loading Overlay */}
             {(status === 'transcribing' || status === 'analyzing') && (
                <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-10 backdrop-blur-[1px]">
                   <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-xl border border-blue-100 text-blue-600 font-medium animate-in zoom-in-95">
                      <Loader2 className="animate-spin" size={20} />
                      {status === 'transcribing' ? "Đang nghe..." : "Đang phân tích..."}
                   </div>
                </div>
             )}
           </div>

           {/* Toolbar */}
           <div className="p-3 bg-gray-50 border-t flex flex-wrap items-center justify-between gap-4">
              <div className="flex-1 min-w-[200px]">
                 {error && <span className="text-sm text-red-600 flex items-center gap-1 font-medium bg-red-50 px-2 py-1 rounded w-fit"><AlertCircle size={14}/> {error}</span>}
              </div>

              <div className="flex gap-3 w-full sm:w-auto">
                 <button
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    disabled={status !== 'idle' && status !== 'recording'}
                    className={`
                       flex-1 sm:flex-none relative px-6 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all select-none
                       ${isRecording 
                          ? 'bg-red-500 text-white shadow-lg shadow-red-200 scale-95' 
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 shadow-sm'
                       }
                    `}
                 >
                    {isRecording ? <MicOff size={18}/> : <Mic size={18}/>}
                    {isRecording ? <div className="flex items-center gap-2"><span>Thả để gửi</span><AudioVisualizer isRecording={true}/></div> : "Giữ để nói"}
                 </button>

                 <Button
                    onClick={handleAnalyze}
                    disabled={!transcript.trim() || status !== 'idle'}
                    className="flex-1 sm:flex-none px-6 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 transition-all gap-2"
                 >
                    <Calculator size={18} /> Phân tích ngay
                 </Button>
              </div>
           </div>
        </CardContent>
      </Card>

      {/* --- PHẦN 2: KẾT QUẢ & CHỈNH SỬA (Editable Table) --- */}
      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           
           <div className="flex flex-col lg:flex-row gap-6">
              {/* Cột Trái: Thông tin khách & Tổng */}
              <Card className="lg:w-1/3 h-fit border-blue-100 shadow-sm">
                 <CardHeader className="pb-3 border-b bg-blue-50/50">
                    <CardTitle className="text-base flex items-center gap-2 text-blue-800">
                       <User size={18} /> Thông tin đơn hàng
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-5 space-y-6">
                    {/* Tên Khách */}
                    <div>
                       <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Khách hàng</label>
                       <div className="mt-2 flex items-center gap-2">
                           <Input 
                               value={result.customer?.name || ""} 
                               onChange={(e) => setResult({...result, customer: {...result.customer, name: e.target.value}})}
                               className="font-medium text-lg h-10 border-gray-200 focus:border-blue-500"
                               placeholder="Nhập tên khách..."
                           />
                           {result.customer?.found ? (
                              <div className="bg-green-100 text-green-700 p-2 rounded-md" title="Khách quen"><User size={20}/></div>
                           ) : (
                              <div className="bg-orange-100 text-orange-700 p-2 rounded-md" title="Khách vãng lai"><User size={20}/></div>
                           )}
                       </div>
                       {/* Nếu là khách mới thì hiện thêm input SĐT */}
                       {!result.customer?.found && (
                           <Input 
                                className="mt-2 h-9 text-sm" 
                                placeholder="Số điện thoại (Tùy chọn)"
                           />
                       )}
                    </div>
                    
                    {/* Tổng tiền (Tự động tính) */}
                    <div className="pt-4 border-t border-dashed">
                       <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng thanh toán</label>
                       <div className="text-3xl font-bold text-blue-600 mt-1">
                          {result.estimated_total?.toLocaleString()} ₫
                       </div>
                       <p className="text-xs text-gray-400 mt-1 italic">
                          *Đã bao gồm {result.items.length} sản phẩm
                       </p>
                    </div>
                    
                    {/* Nút chốt đơn */}
                    <Button 
                        onClick={handleCreateOrder}
                        className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold text-lg shadow-green-200 shadow-lg"
                    >
                       <ShoppingCart className="mr-2" size={20}/> Tạo đơn hàng
                    </Button>
                 </CardContent>
              </Card>

              {/* Cột Phải: Danh sách sản phẩm (Editable) */}
              <Card className="lg:w-2/3 border-gray-200 shadow-sm overflow-hidden flex flex-col">
                 <CardHeader className="bg-gray-50 border-b py-3 flex flex-row justify-between items-center">
                    <CardTitle className="text-base flex items-center gap-2 text-gray-700">
                       <Package size={18}/> Danh sách sản phẩm
                    </CardTitle>
                    <Badge variant="outline" className="bg-white">{result.items.length} món</Badge>
                 </CardHeader>
                 
                 <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                       <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                          <tr>
                             <th className="px-4 py-3 w-[50px]">Ảnh</th>
                             <th className="px-4 py-3">Tên sản phẩm</th>
                             <th className="px-4 py-3 w-[100px] text-center">SL</th>
                             <th className="px-4 py-3 w-[80px]">Đơn vị</th>
                             <th className="px-4 py-3 w-[120px] text-right">Đơn giá</th>
                             <th className="px-4 py-3 w-[120px] text-right">Thành tiền</th>
                             <th className="px-2 py-3 w-[40px]"></th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                          {result.items.map((item, idx) => (
                             <tr key={idx} className={`group hover:bg-blue-50/30 transition-colors ${!item.found && !item.isNew ? 'bg-red-50/40' : ''}`}>
                                {/* 1. Ảnh */}
                                <td className="px-4 py-3">
                                   <div className="h-10 w-10 rounded bg-gray-100 border flex items-center justify-center overflow-hidden">
                                      {item.image ? (
                                         <img src={item.image} alt="" className="w-full h-full object-cover"/>
                                      ) : (
                                         <Package className="text-gray-300" size={18}/>
                                      )}
                                   </div>
                                </td>

                                {/* 2. Tên Sản Phẩm (Input text nếu cần sửa) */}
                                <td className="px-4 py-3">
                                   <input 
                                      type="text"
                                      value={item.found ? item.product_name : (item.product_name || item.ai_product_name)}
                                      onChange={(e) => updateItem(idx, 'product_name', e.target.value)}
                                      className={`w-full bg-transparent border-none outline-none focus:ring-0 p-0 font-medium ${!item.found ? 'text-red-600 placeholder-red-300' : 'text-gray-800'}`}
                                      placeholder="Nhập tên sản phẩm..."
                                   />
                                   {!item.found && !item.isNew && (
                                      <div className="text-[10px] text-red-500 flex items-center gap-1 mt-1">
                                         <AlertCircle size={10}/> Kho không có món này
                                      </div>
                                   )}
                                </td>

                                {/* 3. Số lượng */}
                                <td className="px-4 py-3 text-center">
                                   <input 
                                      type="number" min="1"
                                      value={item.quantity}
                                      onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                      className="w-16 text-center bg-white border border-gray-200 rounded px-1 py-1 focus:border-blue-500 outline-none font-bold"
                                   />
                                </td>

                                {/* 4. Đơn vị */}
                                <td className="px-4 py-3">
                                   <input 
                                      type="text"
                                      value={item.unit}
                                      onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                                      className="w-full bg-transparent border-none outline-none text-gray-500 text-center"
                                   />
                                </td>

                                {/* 5. Đơn giá */}
                                <td className="px-4 py-3 text-right">
                                   <input 
                                      type="number"
                                      value={item.price}
                                      onChange={(e) => updateItem(idx, 'price', e.target.value)}
                                      className="w-24 text-right bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none p-0"
                                   />
                                </td>

                                {/* 6. Thành tiền (Read only) */}
                                <td className="px-4 py-3 text-right font-bold text-gray-700">
                                   {(item.quantity * item.price).toLocaleString()}
                                </td>

                                {/* 7. Nút Xóa */}
                                <td className="px-2 py-3 text-center">
                                   <button 
                                      onClick={() => removeItem(idx)}
                                      className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100"
                                      title="Xóa dòng này"
                                   >
                                      <Trash2 size={16}/>
                                   </button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>

                 {/* Nút Thêm Mới */}
                 <div className="p-3 border-t bg-gray-50">
                    <Button 
                       variant="outline" 
                       onClick={addItem}
                       className="w-full border-dashed border-gray-300 text-gray-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50"
                    >
                       <Plus size={16} className="mr-2"/> Thêm dòng sản phẩm mới
                    </Button>
                 </div>
              </Card>
           </div>
        </div>
      )}
    </div>
  );
};

export default AIOrderCreator;