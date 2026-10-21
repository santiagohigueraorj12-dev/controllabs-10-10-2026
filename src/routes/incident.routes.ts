import { Router } from 'express';
import { IncidentController } from '../controllers/incident.controller';

const router = Router();

router.post('/', IncidentController.createIncident);
router.get('/', IncidentController.getIncidents);
router.patch('/:id', IncidentController.updateIncident);

export default router;
