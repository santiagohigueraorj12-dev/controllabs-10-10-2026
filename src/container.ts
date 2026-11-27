import { prisma } from './db/prisma';
import { PrismaLoanRepository } from './repositories/prisma-loan.repository';
import { LoanService } from './services/loan.service';

const loanRepository = new PrismaLoanRepository(prisma);
export const loanService = new LoanService(loanRepository);
