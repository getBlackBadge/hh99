export class RequestValidityError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'RequestValidityError';
    }
  }