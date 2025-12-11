// Lưu lịch sử nhập hàng (nhập kho).

import database from '../database/db.js';

export const createStockImportTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS stock_import (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                owner_id UUID NOT NULL,
                import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                product_id UUID NOT NULL,
                quantity INT NOT NULL,
                total_cost DECIMAL(19, 2) NOT NULL,
                imported_by_user_id UUID NOT NULL,
                
                FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
                FOREIGN KEY (imported_by_user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `;
        await database.query(query);
    } catch (error) {
        console.error('Error creating StockImport table:', error); 
        process.exit(1);
    }
}