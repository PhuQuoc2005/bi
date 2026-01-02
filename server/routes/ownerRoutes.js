import express from 'express';
import * as OwnerController from '../controllers/OwnerController.js';
import { verifyToken, isOwner } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes Quản lý employee - Chỉ Owner mới được phép truy cập

// Chỉ Owner mới có thể tạo nhân viên
router.post('/employees', verifyToken, isOwner, OwnerController.createEmployee);

// Lấy tất cả đơn vị tính (UoM) - dùng cho dropdown khi tạo/sửa sản phẩm
router.get('/uoms/all', verifyToken, isOwner, OwnerController.getAllUoms);

router.get('/uoms/store', verifyToken, isOwner, OwnerController.getStoreUoms);

// Lấy đơn vị tính của sản phẩm
router.get('/:productId/uoms', verifyToken, OwnerController.getProductUoms);

// Chỉ Owner mới có thể nhập kho sản phẩm
router.post('/import', verifyToken, isOwner, OwnerController.importStock);

export default router;