import { Module } from '@nestjs/common';
import { PointController } from './point.controller';
import { PointService } from './point.service';
import { UserPointTable } from '../database/userpoint.table';
import { PointHistoryTable } from '../database/pointhistory.table';
import { UserModule } from '../common/user/user.module';
import { PointModule as ManagerPointModule } from '../common/point/point.module';
import { LockModule } from '../common/lock/lock.module';

@Module({
  imports: [UserModule, ManagerPointModule, LockModule],
  controllers: [PointController],
  providers: [PointService, UserPointTable, PointHistoryTable],
})
export class PointModule {}