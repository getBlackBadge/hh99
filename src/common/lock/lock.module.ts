import { Module } from '@nestjs/common';
import { LockManager } from './lock-manager';

@Module({
  providers: [LockManager],
  exports: [LockManager],
})
export class LockModule {}
