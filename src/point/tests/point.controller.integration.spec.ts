import { Test, TestingModule } from '@nestjs/testing';
import { PointController } from '../point.controller';
import { PointService } from '../point.service';
import { UserPointTable } from '../../database/userpoint.table';
import { PointHistoryTable } from '../../database/pointhistory.table';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionType } from "../point.model";

describe('PointController (integration)', () => {
  let controller: PointController;
  let pointService: PointService;
  let userDb: UserPointTable;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointController],
      providers: [PointService, UserPointTable, PointHistoryTable],
    }).compile();

    controller = module.get<PointController>(PointController);
    pointService = module.get<PointService>(PointService);
    userDb = module.get<UserPointTable>(UserPointTable);

    // Initialize test user
    await userDb.insertOrUpdate(1, 1000);
  });

  it('should get user point', async () => {
    const result = await controller.point('1');
    expect(result.point).toBe(1000);
  });

  it('should throw NotFoundException for non-existent user', async () => {
    await expect(controller.point('999')).rejects.toThrow(NotFoundException);
  });

  it('should charge points', async () => {
    const result = await controller.charge('1', { amount: 500 });
    expect(result.point).toBe(1500);
  });

  it('should use points', async () => {
    const result = await controller.use('1', { amount: 300 });
    expect(result.point).toBe(700);
  });

  it('should throw BadRequestException when using more points than available', async () => {
    await expect(controller.use('1', { amount: 2000 })).rejects.toThrow(BadRequestException);
  });

  it('should get point histories', async () => {
    await controller.charge('1', { amount: 100 });
    await controller.use('1', { amount: 50 });

    const histories = await controller.history('1');
    expect(histories.length).toBe(2);
    expect(histories[0].type).toBe(TransactionType.CHARGE);
    expect(histories[1].type).toBe(TransactionType.USE);
  });

  it('should handle concurrent requests', async () => {
    const chargePromises = Array(5).fill(null).map(() => controller.charge('1', { amount: 100 }));
    const usePromises = Array(5).fill(null).map(() => controller.use('1', { amount: 50 }));

    await Promise.all([...chargePromises, ...usePromises]);

    const finalPoint = await controller.point('1');
    expect(finalPoint.point).toBe(1250); // 1000 + (100 * 5) - (50 * 5)
  });
});