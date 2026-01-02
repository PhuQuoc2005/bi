import AIService from '../services/AIService.js';
import db from '../database/db.js'; // Sử dụng kết nối PG của bạn
import fs from 'fs';

export const createDraftOrderFromAI = async (req, res) => {
    try {
        const { message } = req.body;
        // Lấy ID chủ cửa hàng từ Token (do verifyToken cung cấp)
        const owner_id = req.user.userId; 

        if (!message) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập nội dung đơn hàng" });
        }

        // 1. Gọi sang Python để phân tích ngôn ngữ tự nhiên
        const aiResult = await AIService.parseOrderFromText(message);

        // 2. Tìm kiếm và Map sản phẩm từ Database
        // AI trả về tên -> Ta tìm ID, Giá, Tồn kho tương ứng
        const mappedItems = [];
        // 1. Log ra ID của người đang gọi API để kiểm tra
        console.log("👉 DEBUG OWNER ID:", owner_id);

        if (aiResult.items && aiResult.items.length > 0) {
            for (const item of aiResult.items) {
                
                // 2. Log ra tên sản phẩm AI tìm được
                console.log(`👉 Đang tìm: '${item.product_name}' cho user: ${owner_id}`);

                const checkAllQuery = `SELECT id, name, owner_id FROM product WHERE owner_id = $1`;
                const allProducts = await db.query(checkAllQuery, [owner_id]);
                console.log("👉 DANH SÁCH SẢN PHẨM TRONG DB CỦA USER NÀY:");
                allProducts.rows.forEach(p => console.log(`   - ID: ${p.id} | Tên: '${p.name}'`));   

                const productQuery = `
                    SELECT id, name, price, stock, unit, code, images
                    FROM product 
                    WHERE name ILIKE $1 AND owner_id = $2
                    LIMIT 1
                `;
                
                // 3. Thực hiện truy vấn
                const productRes = await db.query(productQuery, [`%${item.product_name}%`, owner_id]);
                
                // 4. Log kết quả tìm thấy
                console.log(`   -> Kết quả: ${productRes.rows.length} sản phẩm`);

                if (productRes.rows.length > 0) {
                    const product = productRes.rows[0];
                    mappedItems.push({
                        found: true,
                        product_id: product.id,
                        product_name: product.name,      // Tên chuẩn trong DB
                        ai_product_name: item.product_name, // Tên AI nghe được
                        quantity: item.quantity,
                        unit: product.unit || item.unit, // Ưu tiên đơn vị trong kho
                        price: parseFloat(product.price),
                        total: parseFloat(product.price) * item.quantity,
                        stock_available: product.stock,
                        image: (() => {
                            if (!product.images) return null;
                            try {
                                // Thử parse xem có phải mảng JSON không (ví dụ: '["img1.jpg", "img2.jpg"]')
                                const parsed = JSON.parse(product.images);
                                return Array.isArray(parsed) ? parsed[0] : parsed;
                            } catch (e) {
                                // Nếu lỗi parse (do nó là link ảnh thường: 'https://...'), thì lấy luôn chuỗi đó
                                return product.images;
                            }
                        })(),
                    });
                } else {
                    // Trường hợp không tìm thấy sản phẩm
                    mappedItems.push({
                        found: false,
                        product_name: item.product_name,
                        quantity: item.quantity,
                        unit: item.unit,
                        note: "Không tìm thấy sản phẩm này trong kho"
                    });
                }
            }
        }

        // 3. Tìm kiếm Khách hàng (Nếu AI phát hiện tên)
        let customerInfo = null;
        if (aiResult.customer_name) {
            const customerQuery = `
                SELECT id, name, phone_number, address, total_outstanding_debt
                FROM customer 
                WHERE name ILIKE $1 AND owner_id = $2
                LIMIT 1
            `;
            const custRes = await db.query(customerQuery, [`%${aiResult.customer_name}%`, owner_id]);
            
            if (custRes.rows.length > 0) {
                customerInfo = custRes.rows[0];
            }
        }

        // 4. Trả kết quả đã làm giàu dữ liệu về cho Client
        return res.status(200).json({
            success: true,
            data: {
                original_message: aiResult.original_message,
                is_debt: aiResult.is_debt,
                customer: customerInfo || { name: aiResult.customer_name, found: false },
                items: mappedItems,
                // Tính tạm tổng tiền của các món tìm thấy
                estimated_total: mappedItems.reduce((sum, item) => sum + (item.found ? item.total : 0), 0)
            }
        });

    } catch (error) {
        console.error("AI Controller Error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Lỗi xử lý AI: " + error.message 
        });
    }
};

export const transcribeAudio = async (req, res) => {
    let tempFilePath = null; // Biến lưu đường dẫn để xóa sau này

    try {
        console.log("🎤 [Controller] Bắt đầu xử lý transcribe...");

        if (!req.files || !req.files.audio) {
            return res.status(400).json({ success: false, message: "Không có file ghi âm" });
        }
        
        const audioFile = req.files.audio;
        tempFilePath = audioFile.tempFilePath; // Lưu lại đường dẫn tạm

        console.log(`📂 [Controller] File tạm tại: ${tempFilePath}`);

        // Gọi Service (Code cũ)
        const text = await AIService.transcribeAudio(tempFilePath);
        
        console.log("✅ [Controller] Kết quả:", text);
        return res.status(200).json({ success: true, text: text });

    } catch (error) {
        console.error("🔥 [Controller] Lỗi:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Lỗi Server: " + (error.message || "Không xác định") 
        });
    } finally {
        // --- ĐOẠN CODE MỚI: DỌN DẸP FILE RÁC ---
        if (tempFilePath) {
            fs.unlink(tempFilePath, (err) => {
                if (err) console.error("⚠️ Không thể xóa file tạm:", err);
                else console.log("🗑️ Đã xóa file tạm:", tempFilePath);
            });
        }
    }
};