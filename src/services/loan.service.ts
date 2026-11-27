import { ICreateLoanDTO } from '../dtos/loan.dto';
import { DomainError } from '../errors/domain.error';
import {
  Loan,
  LoanFilters,
  LoanRepository
} from '../repositories/loan.repository';

type LoanOwnership = Pick<LoanFilters, 'instructorId' | 'guardaId'>;

export class LoanService {
  constructor(private readonly loanRepository: LoanRepository) {}

  // El guardaId llega desde el token; el instructor destinatario, del body.
  public async createLoan(input: ICreateLoanDTO): Promise<Loan> {
    if (!(await this.loanRepository.isActiveInstructor(input.instructorId))) {
      throw new DomainError(
        'VALIDATION_ERROR',
        'El instructor seleccionado no existe o no está activo.'
      );
    }
    return this.loanRepository.create(input);
  }

  public getLoans(filters: LoanFilters = {}): Promise<Loan[]> {
    return this.loanRepository.findAll(filters);
  }

  // ownership limita la consulta al guarda creador o al instructor asignado.
  // El administrador llega sin ownership y puede ver cualquier préstamo.
  public async getLoanDetail(
    id: string,
    ownership: LoanOwnership = {}
  ): Promise<Loan> {
    const loan = await this.loanRepository.findById(id);
    if (!loan) {
      throw new DomainError(
        'NOT_FOUND',
        `No existe un préstamo con identificador ${id}.`
      );
    }
    if (
      (ownership.instructorId && loan.instructorId !== ownership.instructorId) ||
      (ownership.guardaId && loan.guardaId !== ownership.guardaId)
    ) {
      throw new DomainError(
        'FORBIDDEN',
        'No tienes permiso para consultar este préstamo.'
      );
    }
    return loan;
  }

  public async acceptLoan(id: string, instructorId: string): Promise<Loan> {
    // Primero comprueba que exista y que esté asignado a este instructor.
    await this.getLoanDetail(id, { instructorId });

    const updatedLoan = await this.loanRepository.updateStatus(
      id,
      'PENDIENTE_APROBACION',
      'APROBADO_Y_FIRMADO'
    );
    if (updatedLoan) {
      return updatedLoan;
    }

    const currentLoan = await this.loanRepository.findById(id);
    if (!currentLoan) {
      throw new DomainError(
        'NOT_FOUND',
        `No existe un préstamo con identificador ${id}.`
      );
    }
    if (currentLoan.instructorId !== instructorId) {
      throw new DomainError(
        'FORBIDDEN',
        'No tienes permiso para aceptar este préstamo.'
      );
    }
    throw new DomainError(
      'CONFLICT',
      'El préstamo ya fue aceptado y no puede aceptarse nuevamente.'
    );
  }
}
