import express from 'express';
import { placeOrder, getMyOrders, updateOrderStatus } from '../controllers/orderController';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.post('/', requireAuth, placeOrder);
router.get('/me', requireAuth, getMyOrders);
router.put('/:id/status', requireAuth, updateOrderStatus);

export default router;
