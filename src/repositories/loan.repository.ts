import { ICreateLoanDTO } from '../dtos/loan.dto';

export type LoanStatus = 'PENDIENTE_APROBACION' | 'APROBADO_Y_FIRMADO';

export interface Loan extends ICreateLoanDTO {
  // BIGINT de PostgreSQL entregado como texto para no perder precisión en JSON.
  id: string;
  estado: LoanStatus;
  createdAt: string;
  acceptedAt: string | null;
}

export interface LoanFilters {
  roomId?: string;
  instructorId?: string;
  guardaId?: string;
}

export interface LoanRepository {
  create(input: ICreateLoanDTO): Promise<Loan>;
  isActiveInstructor(id: string): Promise<boolean>;
  findAll(filters?: LoanFilters): Promise<Loan[]>;
  findById(id: string): Promise<Loan | null>;
  updateStatus(
    id: string,
    expectedStatus: LoanStatus,
    status: LoanStatus
  ): Promise<Loan | null>;
}
