from pydantic import BaseModel
from typing import Optional, List

# --- Định nghĩa các Models dùng chung ---

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