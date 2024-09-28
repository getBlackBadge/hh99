export class PointNotEnoughError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'PointNotEnoughError';
    }
  }

export class PointExceededError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'PointExceededError';
    }
  }