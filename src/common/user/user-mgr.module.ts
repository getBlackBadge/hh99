import { Module } from '@nestjs/common';
import { UserManager } from './user-mgr';
@Module({
  providers: [UserManager],
  exports: [UserManager],
})
export class UserModule {}