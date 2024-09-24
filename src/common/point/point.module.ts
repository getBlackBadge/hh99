import { Module } from '@nestjs/common';
import { PointManager } from './point-manager';

@Module({
  providers: [PointManager],
  exports: [PointManager],
})
export class PointModule {}