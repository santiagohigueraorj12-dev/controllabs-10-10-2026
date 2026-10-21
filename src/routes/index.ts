import { Router } from 'express';
import loanRoutes from './loan.routes';

const router = Router();

router.use('/loans', loanRoutes);

export default router;
