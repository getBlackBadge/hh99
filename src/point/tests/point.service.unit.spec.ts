import { Test, TestingModule } from '@nestjs/testing';
import { PointService } from '../point.service';
import { UserPointTable } from '../../database/userpoint.table';
import { PointHistoryTable } from '../../database/pointhistory.table';
import { UserPoint, PointHistory, TransactionType } from '../point.model';
import { PointBody } from '../point.dto';

describe('PointService', () => {
  let service: PointService;
  let userDbMock: jest.Mocked<UserPointTable>;
  let historyDbMock: jest.Mocked<PointHistoryTable>;

  beforeEach(async () => {
    const userDbMockFactory = jest.fn(() => ({
      selectById: jest.fn(),
      insertOrUpdate: jest.fn(),
    }));

    const historyDbMockFactory = jest.fn(() => ({
      selectAllByUserId: jest.fn(),
      insert: jest.fn(),
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointService,
        { provide: UserPointTable, useFactory: userDbMockFactory },
        { provide: PointHistoryTable, useFactory: historyDbMockFactory },
      ],
    }).compile();

    service = module.get<PointService>(PointService);
    userDbMock = module.get(UserPointTable) as jest.Mocked<UserPointTable>;
    historyDbMock = module.get(PointHistoryTable) as jest.Mocked<PointHistoryTable>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPoint', () => {
    it('should return user point', async () => {
      const mockUser: UserPoint = { id: 1, point: 100, updateMillis: Date.now() };
      userDbMock.selectById.mockResolvedValue(mockUser);

      const result = await service.getPoint(1);
      expect(result).toEqual(mockUser);
      expect(userDbMock.selectById).toHaveBeenCalledWith(1);
    });

    it('should throw error if user not found', async () => {
      userDbMock.selectById.mockResolvedValue(null);

      await expect(service.getPoint(1)).rejects.toThrow('User not found');
    });
  });

  describe('getHistories', () => {
    it('should return point histories', async () => {
      const mockUser: UserPoint = { id: 1, point: 100, updateMillis: Date.now() };
      const mockHistories: PointHistory[] = [
        { id: 1, userId: 1, amount: 50, type: TransactionType.CHARGE, timeMillis: Date.now() },
      ];
      userDbMock.selectById.mockResolvedValue(mockUser);
      historyDbMock.selectAllByUserId.mockResolvedValue(mockHistories);

      const result = await service.getHistories(1);
      expect(result).toEqual(mockHistories);
      expect(userDbMock.selectById).toHaveBeenCalledWith(1);
      expect(historyDbMock.selectAllByUserId).toHaveBeenCalledWith(1);
    });

    it('should throw error if user not found', async () => {
      userDbMock.selectById.mockResolvedValue(null);

      await expect(service.getHistories(1)).rejects.toThrow('User not found');
    });
  });

  describe('charge', () => {
    it('should charge points successfully', async () => {
      const mockUser: UserPoint = { id: 1, point: 100, updateMillis: Date.now() };
      const chargeAmount = 50;
      userDbMock.selectById.mockResolvedValue(mockUser);
      userDbMock.insertOrUpdate.mockResolvedValue({ ...mockUser, point: 150 });

      const result = await service.charge(1, { amount: chargeAmount });
      expect(result.point).toBe(150);
      expect(userDbMock.insertOrUpdate).toHaveBeenCalledWith(1, 150);
      expect(historyDbMock.insert).toHaveBeenCalledWith(1, chargeAmount, TransactionType.CHARGE, expect.any(Number));
    });

    it('should throw error if charge amount is negative', async () => {
      await expect(service.charge(1, { amount: -50 })).rejects.toThrow('Charge amount must be positive');
    });

    it('should throw error if charge amount exceeds limit', async () => {
      await expect(service.charge(1, { amount: 1000001 })).rejects.toThrow('Charge amount exceeds maximum limit');
    });
  });

  describe('use', () => {
    it('should use points successfully', async () => {
      const mockUser: UserPoint = { id: 1, point: 100, updateMillis: Date.now() };
      const useAmount = 50;
      userDbMock.selectById.mockResolvedValue(mockUser);
      userDbMock.insertOrUpdate.mockResolvedValue({ ...mockUser, point: 50 });

      const result = await service.use(1, { amount: useAmount });
      expect(result.point).toBe(50);
      expect(userDbMock.insertOrUpdate).toHaveBeenCalledWith(1, 50);
      expect(historyDbMock.insert).toHaveBeenCalledWith(1, useAmount, TransactionType.USE, expect.any(Number));
    });

    it('should throw error if use amount is negative', async () => {
      await expect(service.use(1, { amount: -50 })).rejects.toThrow('Use amount must be positive');
    });

    it('should throw error if use amount exceeds current points', async () => {
      const mockUser: UserPoint = { id: 1, point: 100, updateMillis: Date.now() };
      userDbMock.selectById.mockResolvedValue(mockUser);

      await expect(service.use(1, { amount: 150 })).rejects.toThrow('Insufficient points');
    });

    it('should throw error if use amount exceeds limit', async () => {
      await expect(service.use(1, { amount: 1000001 })).rejects.toThrow('Use amount exceeds maximum limit');
    });
  });
});