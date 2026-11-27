import { Loan as PrismaLoan, Prisma, PrismaClient } from '@prisma/client';
import { ICreateLoanDTO } from '../dtos/loan.dto';
import { DomainError } from '../errors/domain.error';
import {
  Loan,
  LoanFilters,
  LoanRepository,
  LoanStatus
} from './loan.repository';

const toLoanStatus = (value: string): LoanStatus => {
  if (value === 'PENDIENTE_APROBACION' || value === 'APROBADO_Y_FIRMADO') {
    return value;
  }
  throw new Error(`Estado de préstamo no reconocido en la base de datos: ${value}`);
};

// Prisma 6 no siempre reporta una violación de CHECK como P2004: con
// PostgreSQL llega como PrismaClientUnknownRequestError con el SQLSTATE 23514
// (por ejemplo numero_pc > 0). Se reconocen ambas formas.
const isCheckConstraintViolation = (error: unknown): boolean =>
  (error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2004') ||
  (error instanceof Prisma.PrismaClientUnknownRequestError &&
    /\b23514\b|violates check constraint/.test(error.message));

export class PrismaLoanRepository implements LoanRepository {
  constructor(private readonly database: PrismaClient) {}

  public async create(input: ICreateLoanDTO): Promise<Loan> {
    try {
      const loan = await this.database.loan.create({
        data: {
          roomId: input.roomId,
          instructorId: input.instructorId,
          guardaId: input.guardaId,
          numeroPc: input.numeroPc
        }
      });
      return this.toDomain(loan);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new DomainError(
          'VALIDATION_ERROR',
          'La sala, el instructor o el guarda indicados no existen.'
        );
      }
      if (isCheckConstraintViolation(error)) {
        throw new DomainError(
          'VALIDATION_ERROR',
          'Los datos del préstamo incumplen una restricción de la base de datos.'
        );
      }
      throw error;
    }
  }

  public async findAll(filters: LoanFilters = {}): Promise<Loan[]> {
    const loans = await this.database.loan.findMany({
      where: filters.roomId ? { roomId: filters.roomId } : undefined,
      orderBy: { createdAt: 'desc' }
    });
    return loans.map((loan) => this.toDomain(loan));
  }

  public async findById(id: string): Promise<Loan | null> {
    const loan = await this.database.loan.findUnique({
      where: { id: BigInt(id) }
    });
    return loan ? this.toDomain(loan) : null;
  }

  public async updateStatus(
    id: string,
    expectedStatus: LoanStatus,
    status: LoanStatus
  ): Promise<Loan | null> {
    const result = await this.database.loan.updateMany({
      where: {
        id: BigInt(id),
        estado: expectedStatus
      },
      data: {
        estado: status,
        acceptedAt:
          status === 'APROBADO_Y_FIRMADO' ? new Date() : null
      }
    });

    return result.count === 0 ? null : this.findById(id);
  }

  private toDomain(loan: PrismaLoan): Loan {
    return {
      id: loan.id.toString(),
      roomId: loan.roomId,
      instructorId: loan.instructorId,
      guardaId: loan.guardaId,
      numeroPc: loan.numeroPc,
      estado: toLoanStatus(loan.estado),
      createdAt: loan.createdAt.toISOString(),
      acceptedAt: loan.acceptedAt?.toISOString() ?? null
    };
  }
}
