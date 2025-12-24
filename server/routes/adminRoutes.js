import express from 'express';
import * as AdminController from '../controllers/AdminController.js';
// Giả định bạn đã có middleware verifyToken và checkRoleAdmin
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/owners', verifyToken, isAdmin, AdminController.getAllOwners);
router.put('/owners/status', verifyToken, isAdmin, AdminController.toggleOwnerStatus);
router.post('/plans', verifyToken, isAdmin, AdminController.createPlan);
router.post('/owners', verifyToken, isAdmin, AdminController.createOwner);
router.put('/owners/:id', verifyToken, isAdmin, AdminController.updateOwner);

export default router;