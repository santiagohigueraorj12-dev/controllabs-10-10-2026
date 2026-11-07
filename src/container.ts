import { InMemoryLoanRepository } from './repositories/in-memory-loan.repository';
import { LoanService } from './services/loan.service';

const loanRepository = new InMemoryLoanRepository();
export const loanService = new LoanService(loanRepository);
