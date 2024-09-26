import { UserPoint, TransactionType } from '../../point/point.model';
import { PointDto } from '../../point/point.dto';
import { Injectable } from '@nestjs/common';
import { PointHistoryTable } from '../../database/pointhistory.table';
import { PointHistory } from '../../point/point.model';

@Injectable()
export class PointManager {
  private maxChargeLimit: number;

  constructor(private readonly historyDb: PointHistoryTable) {
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
  async recordHistory(userId: number, amount: number, type: TransactionType, updateMillis: number): Promise<void> {
    await this.historyDb.insert(userId, amount, type, updateMillis);
  }
  async getHistoriesByUserId(userId: number): Promise<PointHistory[]> {
    return this.historyDb.selectAllByUserId(userId);
  }
}