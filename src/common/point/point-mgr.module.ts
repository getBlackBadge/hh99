import { Module } from '@nestjs/common';
import { PointManager } from './point-mgr';
import { PointHistoryTable } from '../../database/pointhistory.table';

@Module({
  providers: [PointManager, PointHistoryTable],
  exports: [PointManager],
})
export class PointModule {}