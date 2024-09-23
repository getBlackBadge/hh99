import { Injectable } from '@nestjs/common';
import { UserPointTable } from '../database/userpoint.table';
import { PointHistoryTable } from '../database/pointhistory.table';
import { UserPoint, PointHistory, TransactionType } from './point.model';
import { PointBody as PointDto } from "./point.dto";
import { LockManager } from './managers/lock-manager';
import { PointManager } from './managers/point-manager';
import { UserManager } from './managers/user-manager';

@Injectable()
export class PointService {

  private lockManager: LockManager;
  private pointManager: PointManager;
  private userManager: UserManager;

  constructor(
    private readonly userDb: UserPointTable,
    private readonly historyDb: PointHistoryTable,
  ) {
    this.lockManager = new LockManager();
    this.pointManager = new PointManager();
    this.userManager = new UserManager(userDb);
  }

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
