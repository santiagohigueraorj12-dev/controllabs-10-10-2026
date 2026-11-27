import { Router } from 'express';
import { EquipmentController } from '../controllers/equipment.controller';

const router = Router();

router.post('/', EquipmentController.createEquipment);
router.get('/', EquipmentController.getEquipment);
router.patch('/:id', EquipmentController.updateEquipment);

export default router;
