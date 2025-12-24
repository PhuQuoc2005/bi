// server/routes/customerRoutes.js
import express from 'express';
import * as CustomerController from '../controllers/CustomerController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Tất cả route đều cần đăng nhập (verifyToken)
router.use(verifyToken);

router.get('/', CustomerController.getCustomers);
router.post('/', CustomerController.createCustomer);
router.put('/:id', CustomerController.updateCustomer);

export default router;