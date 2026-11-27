import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateLoginPayload } from '../middlewares/validateAuth.middleware';

const router = Router();

router.post('/login', validateLoginPayload, AuthController.login);
router.get('/me', authenticate, AuthController.me);

export default router;
