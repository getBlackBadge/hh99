import { Injectable } from '@nestjs/common';
import { UserPoint, PointHistory, TransactionType } from '../point.model';
import { PointDto } from "../point.dto";

import { PointManager } from '../../common/point/point-mgr';
import { LockManager } from '../../common/lock/lock-mgr';

import { PointHistoryTable } from '../../database/pointhistory.table';
import { UserPointTable } from '../../database/userpoint.table';

@Injectable()
export class PointService {

  constructor(
    private readonly pointManager: PointManager, 
    private readonly lockManager: LockManager,   
    private readonly historyDb: PointHistoryTable,
    private readonly userDb: UserPointTable,
  ) {}

  async getPoint(id: number): Promise<UserPoint> {
    return await this.userDb.selectById(id);
  }

  async getHistories(id: number): Promise<PointHistory[]> {
    await this.userDb.selectById(id);
    return this.historyDb.selectAllByUserId(id);
  }

  async charge(id: number, pointDto: PointDto): Promise<UserPoint> {
    return this.lockManager.withLock(id, async () => {
      const user = await this.userDb.selectById(id);

      this.pointManager.validateCharge(pointDto);
      this.pointManager.add(user, pointDto.amount);
      
      await this.userDb.insertOrUpdate(id, user.point);
      await this.historyDb.insert(id, pointDto.amount, TransactionType.CHARGE, user.updateMillis);
      
      return user;
    });
  }

  async use(id: number, pointDto: PointDto): Promise<UserPoint> {
    return this.lockManager.withLock(id, async () => {
      const user = await this.userDb.selectById(id);

      this.pointManager.validateUse(user, pointDto);
      this.pointManager.use(user, pointDto.amount);

      await this.userDb.insertOrUpdate(id, user.point);
    
      await this.historyDb.insert(id, pointDto.amount, TransactionType.USE, user.updateMillis);
      
      return user;
    });
  }

}
