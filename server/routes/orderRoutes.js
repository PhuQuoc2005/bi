import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { createOrder, getAllOrders } from '../controllers/OrderController.js';
import { createDraftOrderFromAI, transcribeAudio } from '../controllers/AIController.js';

const router = express.Router();

router.post('/ai/draft', verifyToken, createDraftOrderFromAI);
router.post('/ai/transcribe', verifyToken, transcribeAudio);
router.post('/', verifyToken, createOrder);
router.get('/', verifyToken, getAllOrders);

export default router;