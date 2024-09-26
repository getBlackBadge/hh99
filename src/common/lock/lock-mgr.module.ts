import { Module } from '@nestjs/common';
import { LockManager } from './lock-mgr';

@Module({
  providers: [LockManager],
  exports: [LockManager],
})
export class LockModule {}
