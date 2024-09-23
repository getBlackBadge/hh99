import { UserPoint } from '../point.model';
import { PointBody as PointDto } from "../point.dto";

export class PointManager {
  private maxChargeLimit: number;

  constructor() {
    this.maxChargeLimit = parseInt(process.env.MAX_CHARGE_LIMIT || '1000000', 10);
  }

  validateCharge(pointDto: PointDto): void {
    if (pointDto.amount <= 0) {
      throw new Error('Charge amount must be positive');
    }
    if (pointDto.amount > this.maxChargeLimit) { 
      throw new Error('Charge amount exceeds maximum limit');
    }
  }

  validateUse(user: UserPoint, pointDto: PointDto): void {
    if (pointDto.amount <= 0) {
      throw new Error('Use amount must be positive');
    }
    if (pointDto.amount > user.point) {
      throw new Error('Insufficient points');
    }
    if (pointDto.amount > this.maxChargeLimit) {
      throw new Error('Use amount exceeds maximum limit');
    }
  }

  charge(user: UserPoint, amount: number): void {
    user.point += amount;
    user.updateMillis = Date.now();
  }

  use(user: UserPoint, amount: number): void {
    user.point -= amount;
    user.updateMillis = Date.now();
  }
}