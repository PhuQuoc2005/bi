// Lưu thông tin cơ bản về sản phẩm.

import database from '../database/db.js';

export const createUomTable = async () => {
    try {
        // 1. Tạo bảng uom
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS uom (
                id SERIAL PRIMARY KEY,
                uom_name VARCHAR(50) NOT NULL, -- Ví dụ: 'Tấn', 'Bao'
                owner_id UUID, -- Đơn vị này thuộc về hộ kinh doanh nào

                FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `;
        await database.query(createTableQuery);

        // 2. Tạo UNIQUE INDEX để tránh trùng lặp dữ liệu hệ thống (owner_id IS NULL)
        const createIndexQuery = `
            CREATE UNIQUE INDEX IF NOT EXISTS idx_uom_system_unique 
            ON uom (uom_name) WHERE owner_id IS NULL;
        `;
        await database.query(createIndexQuery);

        // 3. Dữ liệu mẫu (Seed Data) dùng chung cho tất cả Owner
        const seedUnits = [
            'Kg', 'Tấn', 'Tạ', 'Yến',
            'Bao', 'Thùng', 'Hộp', 'Túi', 'Vỉ', 'Lốc', 'Kiện', 'Cuộn',
            'Lít', 'Can', 'Mét', 'Phuy',
            'Cây', 'Thanh', 'Thiên', 'Chuyến', 'Xe'
        ];
    
        // Chuyển mảng thành định dạng: ('Kg', NULL), ('Tấn', NULL)...
        const values = seedUnits.map(unit => `('${unit}', NULL)`).join(', ');

        const seedQuery = `
            INSERT INTO uom (uom_name, owner_id) 
            VALUES ${values}
            ON CONFLICT (uom_name) WHERE owner_id IS NULL DO NOTHING;
        `;
        await database.query(seedQuery);
    } catch (error) {
        console.error('Error creating Uom table:', error); 
        process.exit(1);
    }
}