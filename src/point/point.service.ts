import { Injectable } from '@nestjs/common';
import { PointHistoryTable } from '../database/pointhistory.table';
import { UserPoint, PointHistory, TransactionType } from './point.model';
import { PointDto } from "./point.dto";

import { UserManager } from '../common/user/user-manager';
import { PointManager } from '../common/point/point-manager';
import { LockManager } from '../common/lock/lock-manager';


@Injectable()
export class PointService {

  constructor(
    private readonly historyDb: PointHistoryTable, 
    private readonly userManager: UserManager, 
    private readonly pointManager: PointManager, 
    private readonly lockManager: LockManager,   
  ) {}

  async getPoint(id: number): Promise<UserPoint> {
    return this.userManager.getUser(id);
  }

  async getHistories(id: number): Promise<PointHistory[]> {
    await this.userManager.getUser(id); // This will throw if user not found
    return this.historyDb.selectAllByUserId(id);
  }

  async charge(id: number, pointDto: PointDto): Promise<UserPoint> {
    return this.lockManager.withLock(id, async () => {
      const user = await this.userManager.getUser(id); // This will throw if user not found

      this.pointManager.validateCharge(pointDto);
      this.pointManager.charge(user, pointDto.amount);
      
      await this.userManager.updateUserPoint(id, user.point);
    
      await this.historyDb.insert(
        id,
        pointDto.amount,
        TransactionType.CHARGE,
        user.updateMillis,
      );
      
      return user;
    });
  }

  async use(id: number, pointDto: PointDto): Promise<UserPoint> {
    return this.lockManager.withLock(id, async () => {
      const user = await this.userManager.getUser(id);  // This will throw if user not found

      this.pointManager.validateUse(user, pointDto);
      this.pointManager.use(user, pointDto.amount);

      await this.userManager.updateUserPoint(id, user.point);
    
      await this.historyDb.insert(
        id,
        pointDto.amount,
        TransactionType.USE,
        user.updateMillis,
      );
      return user;
    });
  }

}
