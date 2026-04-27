import { Router } from 'express';
import { register, login, logout, refresh, getMe, registerValidation, loginValidation } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/register', authLimiter, registerValidation, register);
router.post('/login',    authLimiter, loginValidation,    login);
router.post('/logout',   logout);
router.post('/refresh',  refresh);
router.get('/me',        protect, getMe);

export default router;
