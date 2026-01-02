import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import FormData from 'form-data';

dotenv.config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

class AIService {
    // Hàm 1: Phân tích text đơn hàng
    static async parseOrderFromText(message) {
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/api/parse-order`, {
                message: message
            });
            return response.data;
        } catch (error) {
            console.error('[AIService] Connect Error:', error.message);
            throw new Error('Không thể kết nối tới dịch vụ AI');
        }
    }

    // Hàm 2: Dịch file âm thanh (Speech-to-Text)
    static async transcribeAudio(filePath) {
        try {
            console.log(`📡 [Service] Đang gửi file ${filePath} tới Python...`);

            // Kiểm tra file có tồn tại không
            if (!fs.existsSync(filePath)) {
                throw new Error(`File tạm không tồn tại: ${filePath}`);
            }

            const formData = new FormData();
            formData.append('audio', fs.createReadStream(filePath));

            // Gọi sang Python
            const response = await axios.post(`${AI_SERVICE_URL}/api/orders/ai/transcribe`, formData, {
                headers: {
                    ...formData.getHeaders(), // Bắt buộc để Python hiểu đây là file upload
                    'Content-Type': 'multipart/form-data' // Ghi đè cho chắc chắn
                },
                maxBodyLength: Infinity,
                maxContentLength: Infinity
            });
            
            console.log("🐍 [Service] Python phản hồi:", response.data);

            if (!response.data.success) {
                throw new Error(response.data.message || "Python Service báo lỗi");
            }
            
            return response.data.text; 
        } catch (error) {
             console.error('❌ [Service] Lỗi kết nối Python:', error.message);
             if (error.response) {
                console.error('   -> Python Data:', error.response.data);
                console.error('   -> Python Status:', error.response.status);
             } else if (error.code === 'ECONNREFUSED') {
                 throw new Error("Không thể kết nối tới Server Python (Port 8000). Hãy kiểm tra xem nó đã chạy chưa.");
             }
             throw error;
        }
    }
}

export default AIService;