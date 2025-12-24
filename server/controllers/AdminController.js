import database from '../database/db.js';
import bcrypt from 'bcryptjs';

// 1. Lấy danh sách tất cả các Owner để quản lý
export const getAllOwners = async (req, res) => {
    try {
        const query = `
            SELECT u.id, u.full_name, u.phone_number, u.is_active, u.created_at 
            FROM users u
            JOIN role r ON u.role_id = r.id
            WHERE r.role_name = 'OWNER'
            ORDER BY u.created_at DESC
        `;
        const result = await database.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy danh sách Owner" });
    }
};

// 2. Kích hoạt hoặc Khóa tài khoản Owner (Sử dụng trường is_active trong bảng Users)
export const toggleOwnerStatus = async (req, res) => {
    const { ownerId, status } = req.body; // status là boolean
    try {
        await database.query(
            'UPDATE users SET is_active = $1 WHERE id = $2',
            [status, ownerId]
        );
        res.status(200).json({ message: "Cập nhật trạng thái thành công" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi cập nhật trạng thái" });
    }
};

// 3. Quản lý Gói dịch vụ (Thêm gói mới)
export const createPlan = async (req, res) => {
    const { plan_name, price, duration_days, features } = req.body;
    try {
        const query = `
            INSERT INTO subscription_plan (plan_name, price, duration_days, features)
            VALUES ($1, $2, $3, $4) RETURNING *
        `;
        const result = await database.query(query, [plan_name, price, duration_days, JSON.stringify(features)]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi tạo gói dịch vụ" });
    }
};

// 4. Admin tạo tài khoản Owner mới
export const createOwner = async (req, res) => {
    const { full_name, phone_number, password } = req.body;

    try {
        // 1. Validate cơ bản
        if (!full_name || !phone_number || !password) {
            return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
        }

        // 2. Kiểm tra số điện thoại đã tồn tại chưa
        const checkUser = await database.query(
            'SELECT id FROM users WHERE phone_number = $1',
            [phone_number]
        );
        if (checkUser.rows.length > 0) {
            return res.status(400).json({ message: "Số điện thoại này đã được đăng ký" });
        }

        // 3. Lấy role_id của 'OWNER'
        const roleResult = await database.query("SELECT id FROM role WHERE role_name = 'OWNER'");
        if (roleResult.rows.length === 0) {
            return res.status(500).json({ message: "Lỗi hệ thống: Không tìm thấy role OWNER" });
        }
        const ownerRoleId = roleResult.rows[0].id;

        // 4. Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // 5. Tạo user mới
        const query = `
            INSERT INTO users (full_name, phone_number, password, role_id, is_active)
            VALUES ($1, $2, $3, $4, true)
            RETURNING id, full_name, phone_number, created_at
        `;
        const newUser = await database.query(query, [full_name, phone_number, hashedPassword, ownerRoleId]);

        res.status(201).json({
            message: "Tạo tài khoản Owner thành công",
            data: newUser.rows[0]
        });

    } catch (error) {
        console.error("Create Owner Error:", error);
        res.status(500).json({ message: "Lỗi server khi tạo Owner" });
    }
};

// 5. Cập nhật thông tin Owner (Sửa tên, SĐT, Reset Pass)
export const updateOwner = async (req, res) => {
    const { id } = req.params;
    const { full_name, phone_number, password } = req.body;

    try {
        // 1. Kiểm tra ID
        if (!id) return res.status(400).json({ message: "Thiếu ID người dùng" });

        // 2. Validate SĐT (nếu có thay đổi)
        if (phone_number) {
            const checkPhone = await database.query(
                'SELECT id FROM users WHERE phone_number = $1 AND id != $2',
                [phone_number, id]
            );
            if (checkPhone.rows.length > 0) {
                return res.status(400).json({ message: "Số điện thoại đã được sử dụng bởi tài khoản khác" });
            }
        }

        // 3. Xây dựng câu truy vấn động (chỉ update trường nào có gửi lên)
        let updateFields = [];
        let values = [];
        let index = 1;

        if (full_name) {
            updateFields.push(`full_name = $${index++}`);
            values.push(full_name);
        }
        if (phone_number) {
            updateFields.push(`phone_number = $${index++}`);
            values.push(phone_number);
        }
        if (password && password.trim() !== "") {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields.push(`password = $${index++}`);
            values.push(hashedPassword);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: "Không có dữ liệu nào để cập nhật" });
        }

        // Thêm ID vào cuối mảng values cho WHERE clause
        values.push(id);
        
        const query = `
            UPDATE users 
            SET ${updateFields.join(', ')}, updated_at = NOW() 
            WHERE id = $${index}
            RETURNING id, full_name, phone_number
        `;

        const result = await database.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }

        res.status(200).json({ 
            message: "Cập nhật thành công", 
            data: result.rows[0] 
        });

    } catch (error) {
        console.error("Update Owner Error:", error);
        res.status(500).json({ message: "Lỗi server khi cập nhật Owner" });
    }
};