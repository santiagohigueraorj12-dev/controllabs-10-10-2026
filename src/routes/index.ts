import { Router } from 'express';
import loanRoutes from './loan.routes';
import userRoutes from './user.routes';
import environmentRoutes from './environment.routes';
import equipmentRoutes from './equipment.routes';

const router = Router();

router.use('/loans', loanRoutes);
router.use('/users', userRoutes);
router.use('/environments', environmentRoutes);
router.use('/equipment', equipmentRoutes);

export default router;
