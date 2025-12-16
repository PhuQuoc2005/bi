import database from '../database/db.js';

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