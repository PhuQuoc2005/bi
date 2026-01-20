import { generateToken } from "../utils/JwtToken.js";
import database from '../database/db.js';
import { checkPlanLimit } from '../utils/planLimiter.js';
import bcrypt from 'bcryptjs';

export const signup = async (req, res) => {
    // Chỉ nhận các thông tin cơ bản, không cho phép client gửi role_id hoặc owner_id
    const { full_name, shop_name, phone_number, password } = req.body;

    try {
        // 1. Kiểm tra các trường bắt buộc
        if (!full_name || !phone_number || !password) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ họ tên, số điện thoại và mật khẩu' });
        }

        // 2. Validate độ dài mật khẩu
        if (password.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
        }

        // 3. Validate định dạng số điện thoại (10 chữ số)
        const regex = /^\d{10}$/;
        if (!regex.test(phone_number)) {
            return res.status(400).json({ message: 'Số điện thoại không hợp lệ (phải có 10 chữ số)' });
        }

        // 4. Kiểm tra số điện thoại đã tồn tại chưa
        const checkUser = await database.query(
            'SELECT id FROM "users" WHERE phone_number = $1',
            [phone_number]
        );

        if (checkUser.rows.length > 0) {
            return res.status(400).json({ message: 'Số điện thoại này đã được sử dụng' });
        }

        // 5. Hash mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // 6. Cấu hình mặc định cho Owner mới đăng ký:
        const role_id = 2;       // Mặc định là OWNER
        const status = 'PENDING'; // Chờ Admin duyệt
        const plan_id = 1;       // GÓI MẶC ĐỊNH LÀ FREE (ID = 1)

        // 7. Thực hiện lưu vào Database
        const newUser = await database.query(
            `
                INSERT INTO "users"
                (full_name, phone_number, password, role_id, status, shop_name, plan_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id, full_name, phone_number, shop_name, status, created_at
            `,
            [full_name, phone_number, hashedPassword, role_id, status, shop_name, plan_id]
        );

        if (newUser.rows.length > 0) {
            // Không tạo Token ở đây vì tài khoản chưa được ACTIVE, không cho phép đăng nhập ngay
            return res.status(201).json({
                message: 'Đăng ký tài khoản Owner thành công! Vui lòng chờ quản trị viên phê duyệt.',
                data: newUser.rows[0]
            });
        } else {
            return res.status(400).json({ message: 'Không thể tạo tài khoản, dữ liệu không hợp lệ' });
        }

    } catch (error) {
        console.error('Error in signup controller:', error);
        return res.status(500).json({ message: 'Lỗi hệ thống, vui lòng thử lại sau' });
    }
};

export const login = async (req, res) => {
    const { phone_number, password } = req.body;
    try {
        // Validate input
        if (!phone_number || !password){
            return res.status(400).json({ message: 'Phone number and password are required' });
        }

        // Validate phone format
        const regex = /^\d{10}$/;
        if (!regex.test(phone_number)) {
            return res.status(400).json({ message: 'Invalid phone number format' });
        }

        // find user
        const result = await database.query(
            `
                SELECT id, full_name, phone_number, password, role_id, status
                FROM "users"
                WHERE phone_number = $1
            `,
            [phone_number]
        );

        // Not found
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid phone number or password' });
        }

        const user = result.rows[0];

        // Check active
        if (user.status !== 'ACTIVE') {
            return res.status(403).json({ message: 'Account is inactive' });
        }


        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) return res.status(400).json({ message: 'Invalid phone number or password' });

        const token = generateToken(user.id, res);

        res.status(200).json({ 
            id: user.id,
            full_name: user.full_name,
            phone_number: user.phone_number,
            role_id: user.role_id,
            token: token
        });
    } catch (error) {
        console.error('Error in login controller:', error);
        res.status(500).json({ message: 'Internal Server error' });
    }
};

export const logout = (req, res) => {
    try {
        // Cấu hình giống hệt lúc tạo (quan trọng nhất là secure và sameSite)
        // Nếu bạn chạy localhost, secure phải là false
        const isProduction = process.env.NODE_ENV === 'production';

        const cookieOptions = {
            httpOnly: true,
            secure: isProduction, 
            sameSite: 'lax',
            path: '/' // <-- QUAN TRỌNG: Đảm bảo xóa ở root
        };

        // 1. Xóa cookie chính 'jwt'
        res.clearCookie('jwt', cookieOptions);
        
        // 2. Xóa các cookie 'lạ' mà bạn thấy (token, role) để chắc chắn
        res.clearCookie('token', cookieOptions);
        res.clearCookie('role', cookieOptions);

        // 3. Biện pháp mạnh: Set đè lên cookie cũ với ngày hết hạn trong quá khứ
        res.cookie('jwt', '', { ...cookieOptions, expires: new Date(0) });
        res.cookie('token', '', { ...cookieOptions, expires: new Date(0) });
        res.cookie('role', '', { ...cookieOptions, expires: new Date(0) });

        res.status(200).json({ success: true, message: "Đã xóa toàn bộ cookie" });
    } catch (error) {
        console.error("Logout Error:", error);
        res.status(200).json({ success: true, message: "Logout (Force)" });
    }
};
