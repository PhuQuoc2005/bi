import express from 'express';
import * as OrderController from '../controllers/OrderController.js';
import { createOrder, getAllOrders } from '../controllers/OrderController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route tạo đơn hàng mới
router.post('/', verifyToken, OrderController.createOrder);
router.get('/', verifyToken, getAllOrders);

export default router;