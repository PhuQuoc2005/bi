import { generateToken } from "../utils/JwtToken.js";
import { checkPlanLimit } from '../utils/planLimiter.js';
import database from '../database/db.js';
import bcrypt from 'bcryptjs';

export const createEmployee = async (req, res) => {
    const { full_name, phone_number, password } = req.body;
    const owner_id = req.user.userId; // ID của Owner lấy từ middleware verifyToken

    try {
        // 1. Kiểm tra các trường bắt buộc
        if (!full_name || !phone_number || !password) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ họ tên, số điện thoại và mật khẩu' });
        }

        // 2. Validate định dạng dữ liệu (Giống logic signup) 
        if (password.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu nhân viên phải có ít nhất 6 ký tự' });
        }
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phone_number)) {
            return res.status(400).json({ message: 'Số điện thoại không hợp lệ (phải có 10 chữ số)' });
        }

        // 3. Kiểm tra số điện thoại đã tồn tại trong hệ thống chưa
        const checkUser = await database.query(
            'SELECT id FROM "users" WHERE phone_number = $1',
            [phone_number]
        );
        if (checkUser.rows.length > 0) {
            return res.status(400).json({ message: 'Số điện thoại này đã được sử dụng cho một tài khoản khác' });
        }

        // 4. KIỂM TRA GIỚI HẠN GÓI DỊCH VỤ (PLAN LIMIT) [cite: 175]
        const canCreate = await checkPlanLimit(owner_id, 'employee');
        if (!canCreate) {
            return res.status(403).json({ 
                success: false, 
                message: 'Bạn đã đạt giới hạn số lượng nhân viên của gói hiện tại. Vui lòng nâng cấp gói để thêm mới!' 
            });
        }

        // 5. Hash mật khẩu cho nhân viên
        const hashedPassword = await bcrypt.hash(password, 10);

        // 6. Cấu hình mặc định cho Employee:
        // - role_id = 3 (Nhân viên)
        // - status = 'ACTIVE' (Nhân viên do Owner tạo thì hoạt động ngay)
        // - owner_id = ID của người tạo (Owner) để quản lý theo cửa hàng
        const role_id = 3; 
        const status = 'ACTIVE';

        // 7. Lưu vào Database
        const newUser = await database.query(
            `
                INSERT INTO "users"
                (full_name, phone_number, password, role_id, status, owner_id)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, full_name, phone_number, status, created_at
            `,
            [full_name, phone_number, hashedPassword, role_id, status, owner_id]
        );

        if (newUser.rows.length > 0) {
            return res.status(201).json({
                success: true,
                message: 'Tạo tài khoản nhân viên thành công!',
                data: newUser.rows[0]
            });
        } else {
            return res.status(400).json({ message: 'Không thể tạo tài khoản nhân viên, dữ liệu không hợp lệ' });
        }

    } catch (error) {
        console.error('Error in createEmployee controller:', error);
        return res.status(500).json({ message: 'Lỗi hệ thống, vui lòng thử lại sau' });
    }
};

export const importStock = async (req, res) => {
    const { id, name, category, price, importPrice, quantity, code, unit, supplier } = req.body;
    const userId = req.user.id;

    const client = await database.connect();
    try {
        await client.query('BEGIN');

        let productId = id;
        let isSellingAtLoss = false;

        // 1. Xử lý thông tin Sản phẩm (Product)
        if (!productId) {
            // Tạo Sản phẩm mới hoàn toàn
            const newProd = await client.query(
                `INSERT INTO product (name, category_name, selling_price, code, unit, is_active) 
                 VALUES ($1, $2, $3, $4, $5, true) RETURNING id`,
                [name, category, price, code, unit]
            );
            productId = newProd.rows[0].id;
        } else {
            // Cập nhật giá bán mới cho Sản phẩm cũ
            await client.query('UPDATE product SET selling_price = $1 WHERE id = $2', [price, productId]);
        }

        // 2. Lấy dữ liệu tồn kho hiện tại để tính giá vốn bình quân
        const currentInv = await client.query(
            'SELECT stock_quantity, average_cost FROM inventory WHERE product_id = $1',
            [productId]
        );

        let newTotalQty = quantity;
        let newAverageCost = importPrice;

        if (currentInv.rows.length > 0) {
            const oldQty = parseFloat(currentInv.rows[0].stock_quantity || 0);
            const oldAvgCost = parseFloat(currentInv.rows[0].average_cost || 0);

            newTotalQty = oldQty + quantity;
            // Công thức Bình quân gia quyền
            newAverageCost = ((oldQty * oldAvgCost) + (quantity * importPrice)) / newTotalQty;
        }

        // 3. Kiểm tra rủi ro bán lỗ (Cảnh báo nếu giá bán < giá vốn mới)
        if (price < newAverageCost) {
            isSellingAtLoss = true;
        }

        // 4. Cập nhật hoặc Thêm mới vào Inventory
        await client.query(
            `INSERT INTO inventory (product_id, stock_quantity, average_cost, updated_at) 
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (product_id) 
             DO UPDATE SET 
                stock_quantity = EXCLUDED.stock_quantity, 
                average_cost = EXCLUDED.average_cost,
                updated_at = NOW()`,
            [productId, newTotalQty, newAverageCost]
        );

        // 5. Lưu lịch sử nhập hàng (Để làm báo cáo Thông tư 88)
        await client.query(
            `INSERT INTO stock_import (user_id, product_id, quantity, import_price, supplier_info) 
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, productId, quantity, importPrice, supplier]
        );

        await client.query('COMMIT');
        
        res.status(200).json({ 
            message: "Nhập hàng thành công!", 
            productId,
            warning: isSellingAtLoss ? "Cảnh báo: Giá bán lẻ đang thấp hơn giá vốn bình quân!" : null,
            newAverageCost: newAverageCost.toFixed(2)
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: "Lỗi hệ thống: " + error.message });
    } finally {
        client.release();
    }
};