import { generateToken } from "../utils/JwtToken.js";
import { checkPlanLimit } from '../utils/planLimiter.js';
import database from '../database/db.js';
import bcrypt from 'bcryptjs';

// Tạo nhân viên
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

// Lấy danh sách nhân viên thuộc quản lý của Owner
export const getEmployees = async (req, res) => {
    const owner_id = req.user.userId;
    const { search } = req.query;

    try {
        let query = `
            SELECT id, full_name, phone_number, status, created_at 
            FROM users 
            WHERE owner_id = $1 AND role_id = 3
        `;
        const params = [owner_id];

        if (search) {
            query += ` AND (full_name ILIKE $2 OR phone_number ILIKE $2)`;
            params.push(`%${search}%`);
        }

        query += ` ORDER BY created_at DESC`;

        const result = await database.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error in getEmployees:', error);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách nhân viên' });
    }
};

// Khóa hoặc Mở khóa tài khoản nhân viên
export const toggleStaffStatus = async (req, res) => {
    const { id } = req.params;
    const owner_id = req.user.userId;

    try {
        // Kiểm tra xem nhân viên có thuộc quyền quản lý của Owner không
        const checkStaff = await database.query(
            'SELECT id, status FROM users WHERE id = $1 AND owner_id = $2',
            [id, owner_id]
        );

        if (checkStaff.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
        }

        const currentStatus = checkStaff.rows[0].status;
        const newStatus = currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';

        await database.query(
            'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2',
            [newStatus, id]
        );

        res.status(200).json({ success: true, message: `Đã cập nhật trạng thái thành ${newStatus}` });
    } catch (error) {
        console.error('Error in toggleStaffStatus:', error);
        res.status(500).json({ message: 'Lỗi cập nhật trạng thái' });
    }
};

// Đổi mật khẩu nhân viên
export const changeStaffPassword = async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    const owner_id = req.user.userId;

    if (!password || password.length < 6) {
        return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await database.query(
            'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2 AND owner_id = $3',
            [hashedPassword, id, owner_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
        }

        res.status(200).json({ success: true, message: 'Đã đổi mật khẩu nhân viên thành công' });
    } catch (error) {
        console.error('Error in changeStaffPassword:', error);
        res.status(500).json({ message: 'Lỗi khi đổi mật khẩu' });
    }
};

// Xóa nhân viên
export const deleteEmployee = async (req, res) => {
    const { id } = req.params;
    const owner_id = req.user.userId;

    try {
        // Kiểm tra nhân viên có thuộc quyền quản lý của Owner không
        const result = await database.query(
            'DELETE FROM users WHERE id = $1 AND owner_id = $2 AND role_id = 3',
            [id, owner_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Không tìm thấy nhân viên hoặc bạn không có quyền xóa' });
        }

        res.status(200).json({ success: true, message: 'Đã xóa nhân viên thành công' });
    } catch (error) {
        console.error('Error in deleteEmployee:', error);
        // Nếu nhân viên đã có dữ liệu liên quan (như hóa đơn), nên báo lỗi ràng buộc
        if (error.code === '23503') {
            return res.status(400).json({ message: 'Không thể xóa nhân viên này vì đã có dữ liệu giao dịch liên quan. Hãy sử dụng chức năng "Khóa" thay thế.' });
        }
        res.status(500).json({ message: 'Lỗi khi xóa nhân viên' });
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
            SELECT DISTINCT u.uom_name, u.base_unit, pu.conversion_factor, u.id as uom_id
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
                'SELECT unit, price FROM product WHERE id = $1', 
                [productId]
            );

            if (productBase.rows.length > 0) {
                return res.status(200).json([{
                    product_uom_id: null,
                    uom_id: null,
                    uom_name: productBase.rows[0].unit || 'Cái',
                    conversion_factor: 1,
                    is_base_unit: true,
                    selling_price: productBase.rows[0].price
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
    const owner_id = req.user.userId; 
    const { 
        id, isNewProduct, code, name, category, price, 
        quantity, importPrice, supplier, unit,
        newUomName, conversionFactor 
    } = req.body;

    const client = await database.connect();
    try {
        await client.query('BEGIN');

        let productId = id;

        // BƯỚC 1: Xử lý thông tin Sản phẩm
        if (isNewProduct || !productId) {
            const insertProductSql = `
                INSERT INTO product (owner_id, code, name, category, price, stock, unit, created_at)
                VALUES ($1, $2, $3, $4, $5, 0, $6, NOW())
                RETURNING id;
            `;
            const productRes = await client.query(insertProductSql, [owner_id, code, name, category, price, unit]);
            productId = productRes.rows[0].id;
        } else {
            // Nếu sản phẩm cũ, cập nhật lại giá bán lẻ mới và đơn vị cơ sở nếu cần
            await client.query(
                `UPDATE product SET price = $1, unit = $2, updated_at = NOW() WHERE id = $3`,
                [price, unit, productId]
            );
        }

        // BƯỚC 2: Xử lý bảng UOM (Lưu mối quan hệ Đơn vị nhập -> Đơn vị cơ sở)
        const findUomSql = `
            SELECT id FROM uom 
            WHERE uom_name = $1 AND (owner_id = $2 OR owner_id IS NULL)
            LIMIT 1;
        `;
        let uomRes = await client.query(findUomSql, [newUomName, owner_id]);
        let uomId;

        if (uomRes.rows.length === 0) {
            // CẬP NHẬT: Thêm cả base_unit vào bảng uom khi tạo mới đơn vị cho Owner
            const insertUomSql = `
                INSERT INTO uom (uom_name, base_unit, owner_id) 
                VALUES ($1, $2, $3) 
                RETURNING id;
            `;
            const newUom = await client.query(insertUomSql, [newUomName, unit, owner_id]);
            uomId = newUom.rows[0].id;
        } else {
            uomId = uomRes.rows[0].id;
            // CẬP NHẬT: Cập nhật lại base_unit nếu đơn vị này trước đó chưa có hoặc bị sai
            await client.query(
                `UPDATE uom SET base_unit = $1 WHERE id = $2 AND owner_id = $3`,
                [unit, uomId, owner_id]
            );
        }

        // BƯỚC 3: Xử lý bảng PRODUCT_UOM (Quy đổi cho sản phẩm cụ thể)
        
        // 3.1. Đảm bảo đơn vị cơ sở (hệ số 1) luôn tồn tại cho sản phẩm này
        // Lấy ID của đơn vị cơ sở
        let baseUomRes = await client.query(findUomSql, [unit, owner_id]);
        if (baseUomRes.rows.length > 0) {
            await client.query(`
                INSERT INTO product_uom (product_id, uom_id, conversion_factor, is_base_unit, selling_price)
                VALUES ($1, $2, 1, true, $3)
                ON CONFLICT (product_id, uom_id) DO UPDATE SET is_base_unit = true;
            `, [productId, baseUomRes.rows[0].id, price]);
        }

        // 3.2. Lưu/Cập nhật đơn vị quy đổi đang dùng để nhập hàng (ví dụ: Thùng)
        const upsertProductUomSql = `
            INSERT INTO product_uom (product_id, uom_id, conversion_factor, is_base_unit, selling_price)
            VALUES ($1, $2, $3, false, $4)
            ON CONFLICT (product_id, uom_id) DO UPDATE 
            SET conversion_factor = EXCLUDED.conversion_factor,
                selling_price = EXCLUDED.selling_price;
        `;
        await client.query(upsertProductUomSql, [productId, uomId, conversionFactor, price]);

        // BƯỚC 4: Cập nhật tồn kho (quy đổi về đơn vị nhỏ nhất)
        const addedStock = Number(quantity) * Number(conversionFactor);
        await client.query(
            'UPDATE product SET stock = stock + $1 WHERE id = $2',
            [addedStock, productId]
        );

        // BƯỚC 5: Ghi lịch sử nhập kho
        const total_cost = Number(quantity) * Number(importPrice);
        await client.query(`
            INSERT INTO stock_import (product_id, owner_id, quantity, import_price, total_cost, supplier, uom_name, imported_by_user_id, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW());
        `, [productId, owner_id, quantity, importPrice, total_cost, supplier, newUomName, owner_id]);

        await client.query('COMMIT');
        res.status(200).json({ success: true, message: 'Nhập hàng và cập nhật đơn vị thành công!' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Lỗi importStock:", error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    } finally {
        client.release();
    }
};