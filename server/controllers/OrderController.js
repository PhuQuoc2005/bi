import database from '../database/db.js';

export const createOrder = async (req, res) => {
    const { items, total_amount, customer_id, is_debt } = req.body;
    const userId = req.user.id; // ID của nhân viên đang đăng nhập (lấy từ verifyToken)

    if (!items || items.length === 0) {
        return res.status(400).json({ message: "Giỏ hàng trống." });
    }

    const client = await database.connect();

    try {
        await client.query('BEGIN'); // Bắt đầu Transaction

        // 1. Kiểm tra tồn kho và trừ kho cho từng sản phẩm
        for (const item of items) {
            const inventoryCheck = await client.query(
                'SELECT stock_quantity FROM inventory WHERE product_id = $1 FOR UPDATE',
                [item.id]
            );

            if (inventoryCheck.rows.length === 0 || inventoryCheck.rows[0].stock_quantity < item.quantity) {
                throw new Error(`Sản phẩm ${item.name} không đủ tồn kho.`);
            }

            // Trừ số lượng trong kho
            await client.query(
                'UPDATE inventory SET stock_quantity = stock_quantity - $1 WHERE product_id = $2',
                [item.quantity, item.id]
            );
        }

        // 2. Lưu vào bảng sales_order
        const orderResult = await client.query(
            `INSERT INTO sales_order (user_id, customer_id, total_amount, is_debt, status) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [userId, customer_id || null, total_amount, is_debt, 'completed']
        );
        const orderId = orderResult.rows[0].id;

        // 3. Lưu từng món vào bảng order_item
        for (const item of items) {
            await client.query(
                `INSERT INTO order_item (order_id, product_id, quantity, price_at_sale) 
                 VALUES ($1, $2, $3, $4)`,
                [orderId, item.id, item.quantity, item.price]
            );
        }

        // 4. Nếu is_debt = true: Xử lý công nợ
        if (is_debt) {
            if (!customer_id) {
                throw new Error("Phải chọn khách hàng để ghi nợ.");
            }

            // Tạo bản ghi trong debt_transaction
            await client.query(
                `INSERT INTO debt_transaction (customer_id, order_id, amount, type, note) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [customer_id, orderId, total_amount, 'debt', 'Nợ từ đơn hàng POS']
            );

            // Cộng dồn nợ vào bảng customer
            await client.query(
                `UPDATE customer SET total_outstanding_debt = total_outstanding_debt + $1 
                 WHERE id = $2`,
                [total_amount, customer_id]
            );
        }

        // 5. Ghi nhật ký hệ thống (Audit Log)
        await client.query(
            `INSERT INTO audit_log (user_id, action, table_name, record_id, details) 
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, 'CREATE_ORDER', 'sales_order', orderId, `Tạo đơn hàng ${is_debt ? 'ghi nợ' : 'tiền mặt'}`]
        );

        await client.query('COMMIT'); // Hoàn tất thành công
        res.status(201).json({ message: "Đơn hàng đã được tạo thành công!", orderId });

    } catch (error) {
        await client.query('ROLLBACK'); // Hủy bỏ nếu có lỗi
        console.error("Order Error:", error.message);
        res.status(500).json({ message: error.message || "Lỗi khi xử lý đơn hàng." });
    } finally {
        client.release();
    }
};