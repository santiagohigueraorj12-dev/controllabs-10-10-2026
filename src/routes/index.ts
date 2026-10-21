import { Router } from 'express';
import loanRoutes from './loan.routes';
import userRoutes from './user.routes';
import environmentRoutes from './environment.routes';
import equipmentRoutes from './equipment.routes';
import incidentRoutes from './incident.routes';
import dashboardRoutes from './dashboard.routes';

const router = Router();

router.use('/loans', loanRoutes);
router.use('/users', userRoutes);
router.use('/environments', environmentRoutes);
router.use('/equipment', equipmentRoutes);
router.use('/incidents', incidentRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
