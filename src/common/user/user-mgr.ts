import { Injectable } from '@nestjs/common';
import { RequestValidityError } from '../exceptions/validity-error';

@Injectable()
export class UserManager {
  constructor() {}

  validateUserId(id: string): number {
    const userId = Number(id);
    if (isNaN(userId)) {
      throw new RequestValidityError('Invalid user ID');
    }
    return userId;
  }
}