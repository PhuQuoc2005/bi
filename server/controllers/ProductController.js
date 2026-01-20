// BizFlow/server/controllers/ProductController.js
import database from '../database/db.js';
import { saveLog } from '../models/AuditLog.js';
import AIService from '../services/AIService.js';
import { checkPlanLimit } from '../utils/planLimiter.js';

export const getAllProducts = async (req, res) => {
  try {
    // SỬA: Lấy đúng field userId từ token (khớp với authMiddleware)
    const owner_id = req.user.userId; 
    
    const result = await database.query(
      'SELECT * FROM product WHERE owner_id = $1 ORDER BY created_at DESC',
      [owner_id]
    );
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error("Get All Products Error:", error);
    res.status(500).json({ success: false, message: 'Lỗi Server' });
  }
};

export const getProductById = async (req, res) => {
  const { id } = req.params;
  const owner_id = req.user.userId; // SỬA: id -> userId

  try {
    const result = await database.query('SELECT * FROM product WHERE id = $1 AND owner_id = $2', [id, owner_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Get Product By ID Error:", error);
    res.status(500).json({ success: false, message: 'Lỗi Server' });
  }
};

export const createProduct = async (req, res) => {
    try {
        const { name, price, stock, unit, category_id, description, code, images } = req.body;
        const owner_id = req.user.userId;

        // 1. Bắt đầu Transaction
        await db.query('BEGIN');

        // 2. Thêm vào bảng Product
        const productQuery = `
            INSERT INTO product (name, price, stock, unit, category_id, description, images, owner_id, code) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING *
        `;
        const values = [name, price, stock || 0, unit, category_id, description, images, owner_id, code];
        const newProductRes = await db.query(productQuery, values);
        const newProduct = newProductRes.rows[0];

        // 3. TỰ ĐỘNG THÊM VÀO BẢNG INVENTORY
        // Nếu người dùng nhập stock ban đầu thì dùng số đó, nếu không thì để 0
        const initialStock = stock ? parseInt(stock) : 0;
        
        const inventoryQuery = `
            INSERT INTO inventory (product_id, stock, last_updated_at)
            VALUES ($1, $2, NOW())
        `;
        await db.query(inventoryQuery, [newProduct.id, initialStock]);

        // 4. Lưu thành công -> Commit Transaction
        await db.query('COMMIT');

        // 5. Đồng bộ sang AI (RAG)
        // Lưu ý: Gọi sau khi commit để đảm bảo dữ liệu đã an toàn trong DB
        AIService.syncProductsToAI(owner_id, [newProduct]);

        return res.status(201).json({ 
            success: true, 
            message: "Tạo sản phẩm và kho hàng thành công",
            data: newProduct 
        });

    } catch (error) {
        // 6. Nếu có lỗi -> Rollback (Hủy toàn bộ thay đổi)
        await db.query('ROLLBACK');
        console.error("Create Product Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params; // Lấy ID sản phẩm
        const { name, price, stock, unit, category_id, description, code, images } = req.body;
        const owner_id = req.user.userId;
        const oldProductRes = await database.query('SELECT price, name FROM product WHERE id = $1', [id]);
        const oldData = oldProductRes.rows[0];

        // 1. Validate cơ bản
        if (!id) return res.status(400).json({ success: false, message: "Thiếu ID sản phẩm" });

        // 2. Bắt đầu Transaction
        await db.query('BEGIN');

        // 3. Cập nhật bảng PRODUCT
        // Lưu ý: Ta vẫn update cột stock ở đây để giữ dữ liệu hiển thị cũ
        const updateProductQuery = `
            UPDATE product 
            SET name = $1, price = $2, stock = $3, unit = $4, category_id = $5, 
                description = $6, images = $7, code = $8, updated_at = NOW()
            WHERE id = $9 AND owner_id = $10
            RETURNING *
        `;
        
        // Chuyển stock về số nguyên, nếu không nhập thì giữ nguyên giá trị cũ (logic này frontend nên gửi đủ)
        // Ở đây giả định req.body.stock luôn có giá trị mới nhất
        const stockVal = stock !== undefined ? parseInt(stock) : 0;

        const values = [name, price, stockVal, unit, category_id, description, images, code, id, owner_id];
        const result = await db.query(updateProductQuery, values);

        if (result.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm hoặc không có quyền sửa" });
        }

        const updatedProduct = result.rows[0];

        // 4. ĐỒNG BỘ CẬP NHẬT BẢNG INVENTORY
        // Nếu người dùng có gửi thông tin stock mới, ta cập nhật luôn bảng Inventory
        if (stock !== undefined) {
            // Kiểm tra xem đã có dòng inventory chưa
            const checkInv = await db.query(`SELECT id FROM inventory WHERE product_id = $1`, [id]);
            
            if (checkInv.rows.length > 0) {
                // Update
                await db.query(`UPDATE inventory SET stock = $1, last_updated_at = NOW() WHERE product_id = $2`, [stockVal, id]);
            } else {
                // Insert (phòng hờ dữ liệu cũ chưa có)
                await db.query(`INSERT INTO inventory (product_id, stock, last_updated_at) VALUES ($1, $2, NOW())`, [id, stockVal]);
            }
        }

        await saveLog(database, {
          user_id: owner_id,
          action: 'UPDATE_PRODUCT',
          entity_type: 'product',
          entity_id: id,
          old_value: oldData,
          new_value: { name, price }
        });

        // 5. Commit Transaction
        await db.query('COMMIT');

        // 6. Sync lại với AI (RAG)
        AIService.syncProductsToAI(owner_id, [updatedProduct]);

        return res.status(200).json({ 
            success: true, 
            message: "Cập nhật sản phẩm thành công", 
            data: updatedProduct 
        });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error("Update Product Error:", error);
        return res.status(500).json({ success: false, message: "Lỗi Server: " + error.message });
    }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const owner_id = req.user.userId; // SỬA: id -> userId

  try {
    const productRes = await database.query(
        'SELECT name, price, code FROM product WHERE id = $1 AND owner_id = $2',
        [id, owner_id]
    );
    if (productRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }
    const oldData = productRes.rows[0];
    await database.query('DELETE FROM product WHERE id = $1 AND owner_id = $2 RETURNING id', [id, owner_id]);

    await saveLog(database, {
        user_id: owner_id,
        action: 'DELETE_PRODUCT',
        entity_type: 'product',
        entity_id: id,
        old_value: oldData
    });

    res.status(200).json({
      success: true,
      message: 'Đã xóa sản phẩm'
    });
  } catch (error) {
    console.error("Delete Product Error:", error);
    res.status(500).json({ success: false, message: 'Lỗi xóa sản phẩm' });
  }
};