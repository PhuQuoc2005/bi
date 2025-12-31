import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

# Dán cứng API Key của bạn vào đây để test cho chắc
api_key = "AIzaSyBVFYuv1I9Py7nWW_9zSZZByJQqAu9tcYM" # <--- THAY KEY CỦA BẠN VÀO ĐÂY
genai.configure(api_key=api_key)

print("Đang lấy danh sách models...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
except Exception as e:
    print(f"Lỗi: {e}")