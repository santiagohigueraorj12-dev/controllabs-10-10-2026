import { Router } from 'express';
import { EnvironmentController } from '../controllers/environment.controller';

const router = Router();

router.get('/', EnvironmentController.getEnvironments);
router.post('/', EnvironmentController.createEnvironment);
router.patch('/:id', EnvironmentController.updateEnvironment);

export default router;
