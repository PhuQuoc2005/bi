import jwt from 'jsonwebtoken';
import database from '../database/db.js';
import { config } from 'dotenv';

config({ path: './config/config.env' });

/**
 * Middleware xác thực JWT Token
 */
export const verifyToken = (req, res, next) => {
    // Lấy token từ header Authorization (thường có dạng "Bearer <token>")
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Không tìm thấy mã xác thực (Token)." });
    }

    try {
        // Giải mã token bằng Secret Key (sử dụng biến môi trường JWT_SECRET)
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        
        // Lưu thông tin user đã giải mã vào object request để các hàm sau sử dụng
        req.user = decoded;
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error);
        return res.status(403).json({ message: "Mã xác thực không hợp lệ hoặc đã hết hạn." });
    }
};

/**
 * Middleware kiểm tra quyền ADMIN
 * Phải được gọi SAU verifyToken
 */
export const isAdmin = async (req, res, next) => {
    try {
        const userId = req.user.userId; // Lấy từ verifyToken

        // Truy vấn database để lấy tên Role của user hiện tại
        const query = `
            SELECT r.role_name 
            FROM users u
            JOIN role r ON u.role_id = r.id
            WHERE u.id = $1
        `;
        
        const result = await database.query(query, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy thông tin người dùng." });
        }

        const roleName = result.rows[0].role_name;

        // Kiểm tra nếu vai trò là ADMIN
        if (roleName !== 'ADMIN') {
            return res.status(403).json({ 
                message: "Truy cập bị từ chối. Bạn không có quyền Quản trị viên." 
            });
        }

        // Nếu đúng là Admin, cho phép tiếp tục
        next();
    } catch (error) {
        console.error("Admin Check Error:", error);
        return res.status(500).json({ message: "Lỗi hệ thống khi kiểm tra quyền hạn." });
    }
};