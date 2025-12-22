// BizFlow/server/controllers/ProductController.js
import db from '../database/db.js';

export const getAllProducts = async (req, res) => {
  try {
    // SỬA: Lấy đúng field userId từ token (khớp với authMiddleware)
    const owner_id = req.user.userId; 
    
    const result = await db.query(
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
    const result = await db.query('SELECT * FROM product WHERE id = $1 AND owner_id = $2', [id, owner_id]);

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
  const { name, category, price, stock, images } = req.body;
  const owner_id = req.user.userId; // SỬA: id -> userId

  try {
    // --- XỬ LÝ LỖI JSON ---
    // Postgres cột JSON yêu cầu giá trị phải là JSON hợp lệ (VD: "null", "chuỗi", "{}").
    // Chuỗi rỗng "" hoặc text trần sẽ gây lỗi "invalid input syntax for type json".
    
    let imageToSave = null; // Mặc định là null (JSON chấp nhận null)
    
    if (images && images.trim() !== '') {
        // Nếu có link ảnh, dùng JSON.stringify để bọc nó thành chuỗi JSON hợp lệ.
        // Ví dụ: "http://anh.com" -> "\"http://anh.com\""
        imageToSave = JSON.stringify(images);
    }
    // ---------------------

    const sql = `
      INSERT INTO product (owner_id, name, category, price, stock, images, is_active, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *;
    `;
    
    // Truyền imageToSave đã xử lý vào vị trí $6
    const values = [owner_id, name, category, price, stock, imageToSave, true];

    const result = await db.query(sql, values);

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
  const owner_id = req.user.userId; // SỬA: id -> userId
  const { name, category, price, stock, images, is_active } = req.body;

  try {
    const checkProduct = await db.query('SELECT * FROM product WHERE id = $1 AND owner_id = $2', [id, owner_id]);
    if (checkProduct.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    // --- XỬ LÝ LỖI JSON KHI UPDATE ---
    let imageToSave = checkProduct.rows[0].images; // Mặc định giữ cái cũ

    if (images !== undefined) { // Nếu frontend có gửi trường images lên
        if (images === null || images.trim() === '') {
            imageToSave = null;
        } else {
            imageToSave = JSON.stringify(images);
        }
    }
    // ---------------------------------

    const sql = `
      UPDATE product 
      SET name = $1, category = $2, price = $3, stock = $4, images = $5, is_active = $6
      WHERE id = $7
      RETURNING *;
    `;

    const oldData = checkProduct.rows[0];
    const values = [
      name || oldData.name,
      category || oldData.category,
      price || oldData.price,
      stock || oldData.stock,
      imageToSave, // Dùng biến đã xử lý
      is_active !== undefined ? is_active : oldData.is_active,
      id
    ];

    const result = await db.query(sql, values);

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
    const result = await db.query('DELETE FROM product WHERE id = $1 AND owner_id = $2 RETURNING id', [id, owner_id]);

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