// BizFlow/server/controllers/ProductController.js
import database from '../database/db.js';
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
  // 1. Thêm code và unit vào destructuring
  const { name, category, price, stock, images, code, unit } = req.body;
  const owner_id = req.user.userId;

  const canCreate = await checkPlanLimit(owner_id, 'product');
    if (!canCreate) {
        return res.status(403).json({ 
            success: false, 
            message: 'Bạn đã đạt giới hạn số lượng sản phẩm của gói hiện tại. Vui lòng nâng cấp gói!' 
        });
    }

    let imageToSave = null;
    if (images && images.trim() !== '') {
        imageToSave = JSON.stringify(images);
    }

  try {
    let imageToSave = null;
    if (images && images.trim() !== '') {
        imageToSave = JSON.stringify(images);
    }

    // 2. Cập nhật câu SQL INSERT
    const sql = `
      INSERT INTO product (owner_id, name, category, price, stock, images, is_active, code, unit, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *;
    `;
    
    // 3. Thêm tham số vào mảng values
    const values = [owner_id, name, category, price, stock, imageToSave, true, code, unit];

    const result = await database.query(sql, values);

    res.status(201).json({
      success: true,
      message: 'Tạo sản phẩm thành công',
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    res.status(500).json({ success: false, message: 'Lỗi khi tạo sản phẩm' });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const owner_id = req.user.userId;
  // 1. Thêm code, unit vào destructuring
  const { name, category, price, stock, images, is_active, code, unit } = req.body;

  try {
    const checkProduct = await database.query('SELECT * FROM product WHERE id = $1 AND owner_id = $2', [id, owner_id]);
    if (checkProduct.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    let imageToSave = checkProduct.rows[0].images;
    if (images !== undefined) {
        if (images === null || images.trim() === '') imageToSave = null;
        else imageToSave = JSON.stringify(images);
    }

    // 2. Cập nhật SQL UPDATE
    const sql = `
      UPDATE product 
      SET name = $1, category = $2, price = $3, stock = $4, images = $5, is_active = $6, code = $7, unit = $8
      WHERE id = $9
      RETURNING *;
    `;

    const oldData = checkProduct.rows[0];
    const values = [
      name || oldData.name,
      category || oldData.category,
      price || oldData.price,
      stock || oldData.stock,
      imageToSave,
      is_active !== undefined ? is_active : oldData.is_active,
      code || oldData.code, // Cập nhật code
      unit || oldData.unit, // Cập nhật unit
      id
    ];

    const result = await database.query(sql, values);

    res.status(200).json({
      success: true,
      message: 'Cập nhật thành công',
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Update Product Error:", error);
    res.status(500).json({ success: false, message: 'Lỗi cập nhật sản phẩm' });
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const owner_id = req.user.userId; // SỬA: id -> userId

  try {
    const result = await database.query('DELETE FROM product WHERE id = $1 AND owner_id = $2 RETURNING id', [id, owner_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    res.status(200).json({
      success: true,
      message: 'Đã xóa sản phẩm'
    });
  } catch (error) {
    console.error("Delete Product Error:", error);
    res.status(500).json({ success: false, message: 'Lỗi xóa sản phẩm' });
  }
};