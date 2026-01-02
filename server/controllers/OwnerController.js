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


// Lấy tất cả đơn vị tính (UoM) cho Owner
export const getAllUoms = async (req, res) => {
    const userId = req.user.userId; 

    try {
        const query = `
            SELECT id, owner_id, uom_name
            FROM uom 
            WHERE owner_id = $1 OR owner_id IS NULL 
            ORDER BY 
                CASE WHEN owner_id IS NULL THEN 0 ELSE 1 END, -- Hiện đơn vị hệ thống lên trước
                uom_name ASC
        `;
        
        const result = await database.query(query, [userId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error in getAllUoms:", error);
        res.status(500).json({ message: "Không thể lấy danh sách đơn vị tính" });
    }
};

// Lấy danh sách UoM thuộc về cửa hàng của Owner
export const getStoreUoms = async (req, res) => {
    const owner_id = req.user.userId; // Lấy từ token
    try {
        // Lấy tất cả UoM thuộc về các sản phẩm của Owner này
        const query = `
            SELECT DISTINCT u.uom_name, pu.conversion_factor, u.id as uom_id
            FROM product_uom pu
            JOIN uom u ON pu.uom_id = u.id
            JOIN product p ON pu.product_id = p.id
            WHERE p.owner_id = $1
        `;
        const result = await database.query(query, [owner_id]);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error("Get Store Uoms Error:", error);
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách đơn vị' });
    }
};

// Lấy danh sách UoM của sản phẩm
export const getProductUoms = async (req, res) => {
    const { productId } = req.params;

    try {
        // Truy vấn lấy danh sách đơn vị quy đổi của sản phẩm
        const query = `
            SELECT 
                pu.id as product_uom_id,
                u.id as uom_id,
                u.uom_name,
                pu.conversion_factor,
                pu.is_base_unit,
                pu.selling_price
            FROM product_uom pu
            JOIN uom u ON pu.uom_id = u.id
            WHERE pu.product_id = $1
            ORDER BY pu.is_base_unit DESC, pu.conversion_factor ASC
        `;
        
        const result = await database.query(query, [productId]);

        // Trường hợp sản phẩm chưa có bảng quy đổi (Dữ liệu cũ hoặc SP mới tạo sơ sài)
        if (result.rows.length === 0) {
            // Lấy thông tin đơn vị gốc từ bảng product để làm đơn vị cơ sở mặc định
            const productBase = await database.query(
                'SELECT unit, selling_price FROM product WHERE id = $1', 
                [productId]
            );

            if (productBase.rows.length > 0) {
                return res.status(200).json([{
                    product_uom_id: null,
                    uom_id: null,
                    uom_name: productBase.rows[0].unit || 'Cái',
                    conversion_factor: 1,
                    is_base_unit: true,
                    selling_price: productBase.rows[0].selling_price
                }]);
            }
        }

        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error in getProductUoms:", error);
        res.status(500).json({ message: "Lỗi khi lấy danh sách đơn vị quy đổi" });
    }
};

export const importStock = async (req, res) => {
    // Lấy userId từ token (đảm bảo authMiddleware đã gán req.user)
    const owner_id = req.user.userId; 
    const { 
        id, isNewProduct, code, name, category, price, 
        quantity, importPrice, supplier, unit, 
        newUomName, conversionFactor 
    } = req.body;

    const client = await database.connect();
    try {
        await client.query('BEGIN'); // Bắt đầu Transaction

        let productId = id;

        // BƯỚC 1: Nếu là sản phẩm mới, tạo sản phẩm trước
        if (isNewProduct || !productId) {
            const insertProductSql = `
                INSERT INTO product (owner_id, code, name, category, price, stock, unit, created_at)
                VALUES ($1, $2, $3, $4, $5, 0, $6, NOW())
                RETURNING id;
            `;
            const productRes = await client.query(insertProductSql, [owner_id, code, name, category, price, unit]);
            productId = productRes.rows[0].id;
        }

        // BƯỚC 2: Xử lý bảng UOM (Đơn vị tính)
        // Tìm đơn vị trong hệ thống (owner_id IS NULL) hoặc của riêng Owner này
        const findUomSql = `
            SELECT id FROM uom 
            WHERE uom_name = $1 AND (owner_id = $2 OR owner_id IS NULL)
            LIMIT 1;
        `;
        let uomRes = await client.query(findUomSql, [newUomName, owner_id]);
        let uomId;

        if (uomRes.rows.length === 0) {
            // Nếu đơn vị chưa tồn tại, thêm mới vào bảng uom
            const insertUomSql = `INSERT INTO uom (uom_name, owner_id) VALUES ($1, $2) RETURNING id;`;
            const newUom = await client.query(insertUomSql, [newUomName, owner_id]);
            uomId = newUom.rows[0].id;
        } else {
            uomId = uomRes.rows[0].id;
        }

        // BƯỚC 3: Xử lý quy đổi trong bảng PRODUCT_UOM
        // 3.1. Đảm bảo luôn có đơn vị cơ sở (Base Unit) với hệ số = 1
        await client.query(`
            INSERT INTO product_uom (product_id, uom_id, conversion_factor, is_base_unit, selling_price)
            SELECT $1, id, 1, true, $2 FROM uom 
            WHERE uom_name = $3 AND (owner_id = $4 OR owner_id IS NULL)
            ON CONFLICT DO NOTHING;
        `, [productId, price, unit, owner_id]);

        // 3.2. Lưu đơn vị quy đổi đang nhập hàng (ví dụ: Thùng)
        const upsertProductUomSql = `
            INSERT INTO product_uom (product_id, uom_id, conversion_factor, is_base_unit, selling_price)
            VALUES ($1, $2, $3, false, $4)
            ON CONFLICT (product_id, uom_id) DO UPDATE 
            SET conversion_factor = EXCLUDED.conversion_factor;
        `;
        await client.query(upsertProductUomSql, [productId, uomId, conversionFactor, price]);

        // BƯỚC 4: Cập nhật tồn kho thực tế (quy về đơn vị lẻ)
        const addedStock = Number(quantity) * Number(conversionFactor);
        await client.query(
            'UPDATE product SET stock = stock + $1 WHERE id = $2 AND owner_id = $3',
            [addedStock, productId, owner_id]
        );

        // BƯỚC 5: Ghi lịch sử nhập kho và sổ sách (Bookkeeping)
        const total_cost = Number(quantity) * Number(importPrice);
        await client.query(`
            INSERT INTO stock_import (product_id, owner_id, quantity, import_price, total_cost, supplier, uom_name, imported_by_user_id, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW());
        `, [productId, owner_id, quantity, importPrice, total_cost, supplier, newUomName, owner_id]);

        await client.query('COMMIT'); // Hoàn tất
        res.status(200).json({ success: true, message: 'Nhập kho và lưu đơn vị thành công!' });

    } catch (error) {
        await client.query('ROLLBACK'); // Hủy bỏ nếu lỗi
        console.error("Lỗi xử lý nhập kho:", error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lưu dữ liệu' });
    } finally {
        client.release();
    }
};