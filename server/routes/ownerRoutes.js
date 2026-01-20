import express from 'express';
import * as OwnerController from '../controllers/OwnerController.js';
import { verifyToken, isOwner } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route Nhân viên
router.get('/employees', verifyToken, isOwner, OwnerController.getEmployees);
router.post('/employees', verifyToken, isOwner, OwnerController.createEmployee);
router.put('/employees/:id/toggle-status', verifyToken, isOwner, OwnerController.toggleStaffStatus);
router.put('/employees/:id/password', verifyToken, isOwner, OwnerController.changeStaffPassword);
router.delete('/employees/:id', verifyToken, isOwner, OwnerController.deleteEmployee);

// Lấy tất cả đơn vị tính (UoM) - dùng cho dropdown khi tạo/sửa sản phẩm
router.get('/uoms/all', verifyToken, isOwner, OwnerController.getAllUoms);

router.get('/uoms/store', verifyToken, isOwner, OwnerController.getStoreUoms);

// Lấy đơn vị tính của sản phẩm
router.get('/:productId/uoms', verifyToken, OwnerController.getProductUoms);

// Chỉ Owner mới có thể nhập kho sản phẩm
router.post('/import', verifyToken, isOwner, OwnerController.importStock);

export default router;