// Theo dõi các hành động quan trọng trong hệ thống.

import database from '../database/db.js';

export const createAuditLogTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS audit_log (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID,
                action VARCHAR(100) NOT NULL,
                entity_type VARCHAR(100) NOT NULL, -- (Ví dụ: CREATE_ORDER, UPDATE_PRODUCT_PRICE, DEACTIVATE_ACCOUNT)
                entity_id VARCHAR(50), -- Bảng bị tác động (Ví dụ: sales_order, product)
                old_value JSONB,
                new_value JSONB,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            );
        `;
        await database.query(query);
    } catch (error) {
        console.error('Error creating AuditLog table:', error); 
        process.exit(1);
    }
}