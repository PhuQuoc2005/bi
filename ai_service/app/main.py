import os
import json
import uvicorn
import google.generativeai as genai
from fastapi import FastAPI, UploadFile, File
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

# 2. Định nghĩa Data Models
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

# 3. Hàm xử lý AI (Phân tích Text)
async def parse_order_with_gemini(message: str) -> DraftOrderResponse:
    try:
        # SỬA: Dùng model chuẩn 'gemini-2.5-flash'
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"""
        Extract order info from this text to JSON: "{message}"
        JSON format: {{ "customer_name": "string", "items": [{{ "product_name": "string", "quantity": 1, "unit": "string" }}], "is_debt": boolean, "original_message": "string" }}
        If customer name is not found, set null.
        """
        response = model.generate_content(prompt)
        text = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(text)
        return DraftOrderResponse(**data)
    except Exception as e:
        print(f"❌ Lỗi Gemini Parse: {e}")
        return DraftOrderResponse(
            customer_name=None, items=[], is_debt=False, original_message=message
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

# API Dịch giọng nói (Audio) - Bổ sung lại hàm này
@app.post("/api/orders/ai/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    print(f"🎤 Nhận file âm thanh: {audio.filename}")
    try:
        audio_bytes = await audio.read()
        
        # SỬA: Dùng model chuẩn 'gemini-1.5-flash'
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        response = model.generate_content([
            "Hãy chép lại chính xác những gì người nói trong đoạn âm thanh này bằng tiếng Việt. Chỉ trả về văn bản, không thêm lời dẫn.",
            {
                "mime_type": "audio/webm", 
                "data": audio_bytes
            }
        ])
        
        text = response.text.strip()
        print(f"✅ Gemini nghe được: {text}")
        return {"success": True, "text": text}
    
    except Exception as e:
        print(f"❌ Lỗi Gemini Audio: {e}")
        # Nếu model 1.5 flash vẫn lỗi, hãy thử 'models/gemini-2.5-flash-latest'
        return {"success": False, "message": f"Lỗi xử lý âm thanh: {str(e)}"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)