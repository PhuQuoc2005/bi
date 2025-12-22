// BizFlow/server/routes/productRoutes.js
import express from 'express';
import * as productController from '../controllers/ProductController.js';
// SỬA DÒNG NÀY: Import verifyToken thay vì isAuthenticatedUser
import { verifyToken } from '../middleware/authMiddleware.js'; 

const router = express.Router();

// SỬA DÒNG NÀY: Dùng verifyToken
router.get('/', verifyToken, productController.getAllProducts);
router.get('/:id', verifyToken, productController.getProductById);
router.post('/', verifyToken, productController.createProduct);
router.put('/:id', verifyToken, productController.updateProduct);
router.delete('/:id', verifyToken, productController.deleteProduct);

export default router;