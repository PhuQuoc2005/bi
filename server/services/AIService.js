import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Đảm bảo Python server đang chạy ở port 8000
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

class AIService {
    static async parseOrderFromText(message) {
        try {
            // Gọi sang endpoint của Python
            const response = await axios.post(`${AI_SERVICE_URL}/api/parse-order`, {
                message: message
            });
            return response.data;
        } catch (error) {
            console.error('[AIService] Connect Error:', error.message);
            throw new Error('Không thể kết nối tới dịch vụ AI');
        }
    }
}

export default AIService;