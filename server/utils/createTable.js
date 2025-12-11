import { createRoleTable } from '../models/Role.js';
import { createUsersTable } from '../models/Users.js';
import { createCustomerTable } from '../models/Customer.js';
import { createDebtTransactionTable } from '../models/DebtTransaction.js';
import { createProductTable } from '../models/Product.js';
import { createInventoryTable } from '../models/Inventory.js';
import { createStockImportTable } from '../models/StockImport.js';
import { createSalesOrderTable } from '../models/SalesOrder.js';
import { createOrderItemTable } from '../models/OrderItem.js';
import { createDraftOrderTable } from '../models/DraftOrder.js';
import { createAuditLogTable } from '../models/AuditLog.js';

export const createTables = async () => {
    try {
        await createRoleTable();
        await createUsersTable();
        await createCustomerTable();
        await createDebtTransactionTable();
        await createProductTable();
        await createInventoryTable();
        await createStockImportTable();
        await createSalesOrderTable();
        await createOrderItemTable();
        await createDraftOrderTable();
        await createAuditLogTable();
        console.log('All tables created successfully.');
    } catch (error) {
        console.error('Error creating tables:', error); 
    }
}
