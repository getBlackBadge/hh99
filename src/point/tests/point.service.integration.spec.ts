import { Test, TestingModule } from '@nestjs/testing';
import { PointService } from '../point.service';
import { UserPointTable } from '../../database/userpoint.table';
import { PointHistoryTable } from '../../database/pointhistory.table';
import { UserPoint } from '../point.model';

describe('PointService Integration Tests', () => {
  let service: PointService;
  let userDb: UserPointTable;
  let historyDb: PointHistoryTable;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PointService, UserPointTable, PointHistoryTable],
    }).compile();

    service = module.get<PointService>(PointService);
    userDb = module.get<UserPointTable>(UserPointTable);
    historyDb = module.get<PointHistoryTable>(PointHistoryTable);

    // Initialize test user
    await userDb.insertOrUpdate(1, 1000);
  });

  it('should handle concurrent charge requests correctly', async () => {
    const chargeAmount = 100;
    const concurrentRequests = 10;

    const chargePromises = Array(concurrentRequests).fill(null).map(() =>
      service.charge(1, { amount: chargeAmount })
    );

    await Promise.all(chargePromises);

    const finalUser = await userDb.selectById(1);
    expect(finalUser.point).toBe(1000 + (chargeAmount * concurrentRequests));

    const histories = await historyDb.selectAllByUserId(1);
    expect(histories.length).toBe(concurrentRequests);
  });

  it('should handle concurrent use requests correctly', async () => {
    const useAmount = 50;
    const concurrentRequests = 10;

    const usePromises = Array(concurrentRequests).fill(null).map(() =>
      service.use(1, { amount: useAmount })
    );

    await Promise.all(usePromises);

    const finalUser = await userDb.selectById(1);
    expect(finalUser.point).toBe(1000 - (useAmount * concurrentRequests));

    const histories = await historyDb.selectAllByUserId(1);
    expect(histories.length).toBe(concurrentRequests);
  });

  it('should handle mixed charge and use requests correctly', async () => {
    const chargeAmount = 100;
    const useAmount = 50;
    const concurrentRequests = 10;

    const mixedPromises = Array(concurrentRequests).fill(null).map((_, index) =>
      index % 2 === 0
        ? service.charge(1, { amount: chargeAmount })
        : service.use(1, { amount: useAmount })
    );

    await Promise.all(mixedPromises);

    const finalUser = await userDb.selectById(1);
    const expectedPoint = 1000 + (chargeAmount * 5) - (useAmount * 5);
    expect(finalUser.point).toBe(expectedPoint);

    const histories = await historyDb.selectAllByUserId(1);
    expect(histories.length).toBe(concurrentRequests);
  });
});