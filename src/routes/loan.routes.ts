import { Router } from 'express';
import { LoanController } from '../controllers/loan.controller';
import {
  validateLoanIdParameter,
  validateLoanPayload,
  validateLoanSearchQuery
} from '../middlewares/validateLoan.middleware';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas de préstamos exigen un JWT válido (401 si falta o es inválido).
router.use(authenticate);

// Solo el guarda genera préstamos; queda ligado a su identidad del token.
router.post('/', authorize('GUARDA'), validateLoanPayload, LoanController.createLoan);
router.get(
  '/search',
  authorize('ADMIN', 'GUARDA', 'INSTRUCTOR'),
  validateLoanSearchQuery,
  LoanController.getLoansByFilter
);
router.get(
  '/:id',
  authorize('ADMIN', 'GUARDA', 'INSTRUCTOR'),
  validateLoanIdParameter,
  LoanController.getLoanById
);
// Solo el instructor acepta; el servicio verifica que el préstamo sea suyo.
router.put(
  '/:id/accept',
  authorize('INSTRUCTOR'),
  validateLoanIdParameter,
  LoanController.acceptLoanInventory
);

export default router;
