import db from '../database/db.js';
import { saveLog } from '../models/AuditLog.js';

export const createOrder = async (req, res) => {
    // 1. Lấy dữ liệu
    const { items, total_amount, customer_id, is_debt, amount_paid, customer_name, payment_method } = req.body;
    
    const userId = req.user.userId; 
    const ownerId = req.user.owner_id || req.user.userId;

    if (!items || items.length === 0) {
        return res.status(400).json({ success: false, message: "Giỏ hàng trống." });
    }

    // Tính lại tổng tiền (Server-side)
    let calculatedTotal = 0;
    items.forEach(item => {
        const price = parseFloat(item.price) || 0;
        const qty = parseFloat(item.quantity) || 0;
        calculatedTotal += price * qty;
    });
    const finalTotalPrice = calculatedTotal > 0 ? calculatedTotal : (parseFloat(total_amount) || 0);

    const client = await db.connect();

    try {
        await client.query('BEGIN'); // --- TRANSACTION ---

        // 2. Trừ Kho (Cập nhật CẢ 2 BẢNG: inventory và product)
        for (const item of items) {
            // A. Kiểm tra tồn kho trong bảng INVENTORY
            const inventoryCheck = await client.query(
                `SELECT stock FROM inventory WHERE product_id = $1 FOR UPDATE`,
                [item.product_id] 
            );

            if (inventoryCheck.rows.length === 0) {
                throw new Error(`Sản phẩm ID ${item.product_id} chưa thiết lập kho.`);
            }

            const currentStock = parseFloat(inventoryCheck.rows[0].stock);
            const requestQty = parseFloat(item.quantity);
            
            if (currentStock < requestQty) {
                throw new Error(`Sản phẩm ${item.name || 'ID ' + item.product_id} không đủ hàng (Tồn: ${currentStock}, Cần: ${requestQty})`);
            }

            // B. Trừ kho bảng INVENTORY
            await client.query(
                `UPDATE inventory SET stock = stock - $1 WHERE product_id = $2`,
                [requestQty, item.product_id]
            );

            // C. [MỚI] Trừ kho bảng PRODUCT (Để đồng bộ hiển thị)
            await client.query(
                `UPDATE product SET stock = stock - $1 WHERE id = $2`,
                [requestQty, item.product_id]
            );
        }

        // 3. Tạo Đơn Hàng (Bảng sales_order)
        const createOrderQuery = `
            INSERT INTO sales_order (
                owner_id, 
                customer_id,
                customer_name,
                total_price,      
                status, 
                payment_method, 
                is_debt,
                created_by_user_id,
                created_by,
                created_at,
                order_type,
                paid_at,
                tax_price
            ) VALUES (
                $1, $2, $3, $4, 
                'completed', -- Mặc định completed, logic pending xử lý ở dưới nếu cần
                $5,         
                $6, -- is_debt
                $7, $7, -- created_by
                NOW(),  
                'counter', -- Loại đơn tại quầy
                CASE WHEN $6::boolean IS TRUE THEN NULL ELSE NOW() END, 
                0
            )
            RETURNING id
        `;

        // Map phương thức thanh toán chuẩn
        // Nếu is_debt = true -> payment_method là 'debt' (hoặc giữ nguyên logic của bạn)
        const finalPaymentMethod = is_debt ? 'debt' : (payment_method || 'cash');

        const orderRes = await client.query(createOrderQuery, [
            ownerId,
            customer_id || null,
            customer_name || 'Khách lẻ', 
            finalTotalPrice,             
            finalPaymentMethod,
            is_debt || false, 
            userId
        ]);

        const orderId = orderRes.rows[0].id;

        // 4. Lưu Chi Tiết (Bảng order_item)
        for (const item of items) {
            const price = parseFloat(item.price) || 0;
            const qty = parseFloat(item.quantity) || 0;
            
            await client.query(
                `INSERT INTO order_item (order_id, product_id, quantity, price, created_at) 
                 VALUES ($1, $2, $3, $4, NOW())`,
                [
                    orderId,
                    item.product_id,
                    qty,
                    price
                ]
            );
        }

        // 5. Xử lý Nợ (Nếu có)
        if (is_debt && customer_id) {
            // Logic cũ của bạn: Nếu nợ thì tính vào total_outstanding_debt
            const paid = parseFloat(amount_paid) || 0;
            const debtValue = finalTotalPrice - paid;

            if (debtValue > 0) {
                await client.query(
                    `UPDATE customer 
                     SET total_outstanding_debt = total_outstanding_debt + $1 
                     WHERE id = $2`,
                    [debtValue, customer_id]
                );

                await client.query(
                    `INSERT INTO debt_transaction (
                        customer_id, amount, type, transaction_date, description, order_id
                    ) VALUES ($1, $2, 'credit', NOW(), $3, $4)`,
                    [customer_id, debtValue, `Ghi nợ đơn hàng #${orderId}`, orderId]
                );
            }
        }

        await saveLog(client, {
            user_id: userId,
            action: is_debt ? 'CREATE_DEBT_ORDER' : 'CREATE_ORDER',
            entity_type: 'sales_order',
            entity_id: orderId,
            new_value: { total: finalTotalPrice, customer: customer_name, is_debt }
        });

        await client.query('COMMIT'); 
        
        res.status(201).json({ 
            success: true, 
            message: "Tạo đơn hàng thành công!", 
            orderId 
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("🔥 Order Error:", error.message);
        res.status(500).json({ 
            success: false, 
            message: "Lỗi Server: " + error.message 
        });
    } finally {
        client.release();
    }
};

// ... giữ nguyên getAllOrders ...
export const getAllOrders = async (req, res) => {
    try {
        const ownerId = req.user.owner_id || req.user.userId;

        const query = `
            SELECT 
                so.id, 
                so.total_price,
                so.customer_name,
                so.status,
                so.payment_method, 
                so.is_debt,        
                so.order_type,
                so.created_at,
                so.paid_at,
                u.full_name as created_by_name,
                
                CASE 
                    WHEN so.is_debt IS TRUE THEN 'Ghi nợ' 
                    WHEN so.payment_method = 'transfer' THEN 'Chuyển khoản'
                    ELSE 'Tiền mặt' 
                END as payment_label,

                CASE 
                    WHEN so.status = 'completed' THEN 'Hoàn thành'
                    WHEN so.status = 'pending' THEN 'Chờ xử lý'
                    ELSE so.status
                END as status_label

            FROM sales_order so
            LEFT JOIN users u ON so.created_by_user_id = u.id
            WHERE so.owner_id = $1
            ORDER BY so.created_at DESC
        `;

        const result = await db.query(query, [ownerId]);
        
        res.status(200).json({ success: true, data: result.rows });

    } catch (error) {
        console.error("Get Orders Error:", error);
        res.status(500).json({ success: false, message: "Lỗi lấy danh sách đơn hàng" });
    }
};