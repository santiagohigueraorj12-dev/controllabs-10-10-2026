import { ICreateLoanDTO } from '../dtos/loan.dto';

export type LoanStatus = 'PENDIENTE_APROBACION' | 'APROBADO_Y_FIRMADO';

export interface Loan extends ICreateLoanDTO {
  id: number;
  estado: LoanStatus;
  createdAt: string;
  acceptedAt: string | null;
}

export interface LoanFilters {
  roomId?: string;
}

export interface LoanRepository {
  create(input: ICreateLoanDTO): Promise<Loan>;
  findAll(filters?: LoanFilters): Promise<Loan[]>;
  findById(id: number): Promise<Loan | null>;
  updateStatus(
    id: number,
    expectedStatus: LoanStatus,
    status: LoanStatus
  ): Promise<Loan | null>;
}
