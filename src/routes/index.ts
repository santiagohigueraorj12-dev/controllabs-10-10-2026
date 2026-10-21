import { Router } from 'express';
import loanRoutes from './loan.routes';
import userRoutes from './user.routes';
import environmentRoutes from './environment.routes';

const router = Router();

router.use('/loans', loanRoutes);
router.use('/users', userRoutes);
router.use('/environments', environmentRoutes);

export default router;
