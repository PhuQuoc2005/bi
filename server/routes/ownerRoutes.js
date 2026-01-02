import express from 'express';
import * as OwnerController from '../controllers/OwnerController.js';
import { verifyToken, isOwner } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes Quản lý employee - Chỉ Owner mới được phép truy cập

// Chỉ Owner mới có thể tạo nhân viên
router.post('/employees', verifyToken, isOwner, OwnerController.createEmployee);

// Chỉ Owner mới có thể nhập kho sản phẩm
router.post('/import', verifyToken, OwnerController.importStock);

export default router;