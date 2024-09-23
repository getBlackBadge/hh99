import { UserPointTable } from '../../database/userpoint.table';
import { UserPoint } from '../point.model';

export class UserManager {
  constructor(private readonly userDb: UserPointTable) {}

  async getUser(id: number): Promise<UserPoint> {
    const user = await this.userDb.selectById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateUserPoint(id: number, point: number): Promise<void> {
    await this.userDb.insertOrUpdate(id, point);
  }

  validateUserId(id: string): number {
    const userId = Number(id);
    if (isNaN(userId)) {
      throw new Error('Invalid user ID');
    }
    return userId;
  }
}