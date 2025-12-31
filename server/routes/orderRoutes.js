import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { createOrder, getAllOrders } from '../controllers/OrderController.js';
import { createDraftOrderFromAI } from '../controllers/AIController.js';

const router = express.Router();

router.post('/ai/draft', verifyToken, createDraftOrderFromAI);
router.post('/', verifyToken, createOrder);
router.get('/', verifyToken, getAllOrders);

export default router;