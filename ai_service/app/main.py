import os
import json
import uvicorn
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from dotenv import load_dotenv

# 1. Cấu hình môi trường
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("⚠️ CẢNH BÁO: Chưa tìm thấy GOOGLE_API_KEY trong .env")

genai.configure(api_key=api_key)

app = FastAPI(title="BizFlow AI Service")

# 2. Định nghĩa Data Models (Nằm ngay tại đây, không cần import từ đâu cả)
class OrderItem(BaseModel):
    product_name: str
    quantity: float
    unit: str

class DraftOrderResponse(BaseModel):
    customer_name: Optional[str] = None
    items: List[OrderItem]
    is_debt: bool
    original_message: str

class NaturalLanguageOrderRequest(BaseModel):
    message: str
    user_id: Optional[str] = None

# 3. Hàm xử lý AI (Viết trực tiếp tại đây)
async def parse_order_with_gemini(message: str) -> DraftOrderResponse:
    try:
        model = genai.GenerativeModel('gemini-3-flash-preview')
        prompt = f"""
        Extract order info from this text to JSON: "{message}"
        JSON format: {{ "customer_name": "string", "items": [{{ "product_name": "string", "quantity": 1, "unit": "string" }}], "is_debt": boolean, "original_message": "string" }}
        """
        response = model.generate_content(prompt)
        text = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(text)
        return DraftOrderResponse(**data)
    except Exception as e:
        print(f"❌ Lỗi Gemini: {e}")
        # Trả về kết quả rỗng thay vì làm sập server
        return DraftOrderResponse(
            customer_name=None, 
            items=[], 
            is_debt=False, 
            original_message=message
        )

# 4. API Endpoints
@app.get("/")
def read_root():
    return {"status": "AI Service is running properly!"}

@app.post("/api/parse-order", response_model=DraftOrderResponse)
async def parse_order(request: NaturalLanguageOrderRequest):
    print(f"📩 Nhận yêu cầu: {request.message}")
    result = await parse_order_with_gemini(request.message)
    return result

# 5. Cấu hình để chạy trực tiếp được bằng lệnh python
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)