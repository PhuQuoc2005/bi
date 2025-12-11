// Lưu thông tin tất cả người dùng (Admin, Owner, Employee).

import database from '../database/db.js';

export const createUsersTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS users (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                full_name VARCHAR(100) NOT NULL CHECK (char_length(full_name) >= 2),

                phone_number VARCHAR(20) UNIQUE NOT NULL,
                password TEXT NOT NULL,

                role_id BIGINT NOT NULL,
                owner_id UUID DEFAULT NULL, -- NULL nếu là OWNER/ADMIN, FOREIGN KEY tới users.id 
                avatar JSONB DEFAULT NULL,

                is_active BOOLEAN NOT NULL DEFAULT TRUE,

                reset_password_token TEXT DEFAULT NULL,
                reset_password_expire TIMESTAMP DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE,
                FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `;
        await database.query(query);
    } catch (error) {
        console.error('Error creating Users table:', error); 
    }
}