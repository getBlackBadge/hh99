import { Module } from '@nestjs/common';
import { UserManager } from './user-manager';
import { UserPointTable } from '../../database/userpoint.table';
@Module({
  providers: [UserManager, UserPointTable],
  exports: [UserManager],
})
export class UserModule {}