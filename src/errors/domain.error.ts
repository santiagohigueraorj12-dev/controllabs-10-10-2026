export type DomainErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT';

export class DomainError extends Error {
  constructor(
    public readonly code: DomainErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
