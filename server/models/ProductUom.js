// Lưu thông tin cơ bản về sản phẩm.

import database from '../database/db.js';

export const createProductUomTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS product_uom (
                id SERIAL PRIMARY KEY,
                product_id UUID REFERENCES product(id) ON DELETE CASCADE,
                uom_id INTEGER REFERENCES uom(id),
                conversion_factor DECIMAL(10, 2) NOT NULL, -- 1 đơn vị này = bao nhiêu đơn vị cơ sở?
                is_base_unit BOOLEAN DEFAULT false, -- Có phải đơn vị nhỏ nhất để tính kho không?
                selling_price DECIMAL(15, 2), -- Giá bán riêng cho đơn vị này (ví dụ mua cả tấn rẻ hơn mua lẻ kg)

                CONSTRAINT unique_product_uom UNIQUE (product_id, uom_id)
            );
        `;
        await database.query(query);
    } catch (error) {
        console.error('Error creating product_uom table:', error); 
        process.exit(1);
    }
}