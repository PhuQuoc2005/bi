import google.generativeai as genai
import os
import json
from app.models import DraftOrderResponse, OrderItem

# Cấu hình API Key từ biến môi trường
# Lưu ý: Đảm bảo bạn đã có GOOGLE_API_KEY trong file .env
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

async def parse_order_with_gemini(message: str) -> DraftOrderResponse:
    try:
        # Sử dụng model Gemini 1.5 Flash (nhanh và rẻ)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Prompt hướng dẫn AI trả về JSON chuẩn xác
        prompt = f"""
        Bạn là một trợ lý AI cho ứng dụng bán hàng vật liệu xây dựng.
        Nhiệm vụ: Trích xuất thông tin đơn hàng từ câu nói tự nhiên của người dùng và trả về định dạng JSON thuần túy (không có markdown, không có ```json).
        
        Câu nói: "{message}"
        
        Yêu cầu output JSON với các trường:
        - customer_name: Tên khách hàng (nếu có, hoặc null)
        - items: Danh sách sản phẩm (product_name, quantity, unit)
        - is_debt: true nếu có từ khóa ghi nợ/nợ, false nếu trả tiền mặt/không nói gì.
        - original_message: Câu nói gốc.
        
        Ví dụ output mong muốn:
        {{
            "customer_name": "Anh Ba",
            "items": [
                {{ "product_name": "Xi măng", "quantity": 5, "unit": "bao" }}
            ],
            "is_debt": true,
            "original_message": "{message}"
        }}
        """

        response = model.generate_content(prompt)
        
        # Xử lý chuỗi JSON trả về (phòng trường hợp AI thêm markdown)
        json_text = response.text.replace("```json", "").replace("```", "").strip()
        
        # Parse chuỗi thành Dictionary
        data = json.loads(json_text)
        
        # Map vào Pydantic Model để trả về
        return DraftOrderResponse(**data)
        
    except Exception as e:
        print(f"Error calling Gemini: {e}")
        # Trong trường hợp lỗi, trả về một response rỗng hoặc ném lỗi tiếp
        raise e