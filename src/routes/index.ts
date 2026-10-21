import { Router } from 'express';
import loanRoutes from './loan.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/loans', loanRoutes);
router.use('/users', userRoutes);

export default router;
