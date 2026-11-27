import { Router } from 'express';
import { LoanController } from '../controllers/loan.controller';
import {
  validateLoanIdParameter,
  validateLoanPayload,
  validateLoanSearchQuery
} from '../middlewares/validateLoan.middleware';

const router = Router();

router.post('/', validateLoanPayload, LoanController.createLoan);
router.get('/search', validateLoanSearchQuery, LoanController.getLoansByFilter);
router.get('/:id', validateLoanIdParameter, LoanController.getLoanById);
router.put('/:id/accept', validateLoanIdParameter, LoanController.acceptLoanInventory);

export default router;
