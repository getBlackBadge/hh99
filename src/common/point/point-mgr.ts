import { UserPoint } from '../../point/point.model';
import { PointDto } from '../../point/point.dto';
import { Injectable } from '@nestjs/common';
import { RequestValidityError } from '../exceptions/validity-error';
import { PointNotEnoughError, PointExceededError } from '../exceptions/point-error';
@Injectable()
export class PointManager {
  private maxPointLimit: number;

  constructor() {
    this.maxPointLimit = parseInt(process.env.MAX_POINT_LIMIT || '10000000', 10);
  }

  private static readonly ERROR_MESSAGES = {
    NEGATIVE_AMOUNT: 'Amount must be positive',
    EXCEEDS_CHARGE_LIMIT: 'Amount exceeds maximum charge limit',
    INSUFFICIENT_POINTS: 'Insufficient points',
    EXCEEDS_POINT_LIMIT: 'Point exceeds maximum limit',
  };

  public static getErrorMessage(key: keyof typeof PointManager.ERROR_MESSAGES): string {
    return PointManager.ERROR_MESSAGES[key];
  }

  validateAmount(amount: number): void {
    if (amount <= 0) {
      throw new RequestValidityError(PointManager.ERROR_MESSAGES.NEGATIVE_AMOUNT);
    }
  }

  validateCharge(pointDto: PointDto): void {
    this.validateAmount(pointDto.amount);
  }

  validateUse(user: UserPoint, pointDto: PointDto): void {
    this.validateAmount(pointDto.amount);
    if (pointDto.amount > user.point) {
      throw new PointNotEnoughError(PointManager.ERROR_MESSAGES.INSUFFICIENT_POINTS);
    }
  }


  add(user: UserPoint, amount: number): void {
    user.point += amount;
    if (user.point > this.maxPointLimit) {
      throw new PointExceededError(PointManager.ERROR_MESSAGES.EXCEEDS_POINT_LIMIT);
    }
    user.updateMillis = Date.now();
  }

  use(user: UserPoint, amount: number): void {
    user.point -= amount;
    user.updateMillis = Date.now();
  }
}