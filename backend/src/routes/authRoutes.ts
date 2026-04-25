import express from 'express';
import { register, login, getMe, updateMe } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.put('/me', requireAuth, updateMe);

export default router;
