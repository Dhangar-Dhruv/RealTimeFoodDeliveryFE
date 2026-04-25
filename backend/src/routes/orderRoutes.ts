import express from 'express';
import { placeOrder, getMyOrders } from '../controllers/orderController';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.post('/', requireAuth, placeOrder);
router.get('/me', requireAuth, getMyOrders);

export default router;
