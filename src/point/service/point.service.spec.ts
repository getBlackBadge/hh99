import { Test, TestingModule } from '@nestjs/testing';
import { PointService } from './point.service';
import { UserManager } from '../../common/user/user-mgr';
import { PointManager } from '../../common/point/point-mgr';
import { LockManager } from '../../common/lock/lock-mgr';
import { PointHistoryTable } from '../../database/pointhistory.table';
import { UserPointTable } from '../../database/userpoint.table';
import { UserPoint, TransactionType } from '../point.model';
import { PointDto } from '../point.dto';
import { PointHistory } from '../point.model';
import { PointNotEnoughError, PointExceededError } from '../../common/exceptions/point-error';
import { RequestValidityError } from '../../common/exceptions/validity-error';


describe('PointService', () => {
  let service: PointService;
  let userManagerMock: jest.Mocked<UserManager>;
  let pointManagerMock: jest.Mocked<PointManager>;
  let historyDbMock: jest.Mocked<PointHistoryTable>;
  let userDbMock: jest.Mocked<UserPointTable>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointService,
        {
          provide: UserManager,
          useValue: {
            validateUserId: jest.fn(),
          },
        },
        {
          provide: PointManager,
          useValue: {
            validateCharge: jest.fn(),
            validateUse: jest.fn(),
            add: jest.fn(),
            use: jest.fn(),
          },
        },
        {
          provide: LockManager,
          useValue: {
            withLock: jest.fn((id, callback) => callback()),
          },
        },
        {
          provide: PointHistoryTable,
          useValue: {
            selectAllByUserId: jest.fn(),
            insert: jest.fn(),
          },
        },
        {
          provide: UserPointTable,
          useValue: {
            selectById: jest.fn(),
            insertOrUpdate: jest.fn(),
          },
        },
   
      ],
    }).compile();

    service = module.get<PointService>(PointService);
    userManagerMock = module.get(UserManager);
    pointManagerMock = module.get(PointManager);
    historyDbMock = module.get(PointHistoryTable);
    userDbMock = module.get(UserPointTable);
  });

  describe('getPoint', () => {
    it('사용자 포인트를 반환해야 한다', async () => {
      const mockUserPoint: UserPoint = { id: 1, point: 100, updateMillis: Date.now() };
      userDbMock.selectById.mockResolvedValue(mockUserPoint);

      const result = await service.getPoint(1);

      expect(result).toEqual(mockUserPoint);
      expect(userDbMock.selectById).toHaveBeenCalledWith(1);
    });
  });

  describe('getHistories', () => {
    it('포인트 히스토리를 반환해야 한다', async () => {
      const mockHistories = [
        { id: 1, userId: 1, amount: 100, type: TransactionType.CHARGE, createMillis: Date.now() },
        { id: 2, userId: 1, amount: 50, type: TransactionType.USE, createMillis: Date.now() },
      ];
      userDbMock.selectById.mockResolvedValue({ id: 1, point: 50, updateMillis: Date.now() });
      historyDbMock.selectAllByUserId.mockResolvedValue(mockHistories as unknown as PointHistory[]);

      const result = await service.getHistories(1);

      expect(result).toEqual(mockHistories);
      expect(userDbMock.selectById).toHaveBeenCalledWith(1);
      expect(historyDbMock.selectAllByUserId).toHaveBeenCalledWith(1);
    });
    it('사용자의 포인트 기록이 없을 때 빈 배열을 반환해야 한다', async () => {
        userDbMock.selectById.mockResolvedValue({ id: 1, point: 0, updateMillis: Date.now() });
        historyDbMock.selectAllByUserId.mockResolvedValue([]);
  
        const result = await service.getHistories(1);
  
        expect(result).toEqual([]);
        expect(historyDbMock.selectAllByUserId).toHaveBeenCalledWith(1);
      });
  });

  describe('charge', () => {
    it('포인트 히스토리를 반환해야 한다', async () => {
      const mockUserPoint: UserPoint = { id: 1, point: 100, updateMillis: Date.now() };
      const pointDto: PointDto = { amount: 50 };
      userDbMock.selectById.mockResolvedValue(mockUserPoint);

      const result = await service.charge(1, pointDto);

      expect(result).toEqual(mockUserPoint);
      expect(pointManagerMock.validateCharge).toHaveBeenCalledWith(pointDto);
      expect(pointManagerMock.add).toHaveBeenCalledWith(mockUserPoint, 50);
      expect(userDbMock.insertOrUpdate).toHaveBeenCalledWith(1, mockUserPoint.point);
      expect(historyDbMock.insert).toHaveBeenCalledWith(1, 50, TransactionType.CHARGE, mockUserPoint.updateMillis);
    });
    it('유효하지 않은 충전 금액으로 에러를 던져야 한다', async () => {
        const invalidPointDto: PointDto = { amount: -50 };
        pointManagerMock.validateCharge.mockImplementation(() => {
          throw new RequestValidityError('Invalid charge amount');
        });
  
        await expect(service.charge(1, invalidPointDto)).rejects.toThrow('Invalid charge amount');
        expect(pointManagerMock.validateCharge).toHaveBeenCalledWith(invalidPointDto);
      });
    it('충전 금액이 최대 허용 한도를 초과할 때 에러를 던져야 한다', async () => {
        const maxChargeAmount = 1000000;
        const overLimitDto: PointDto = { amount: maxChargeAmount + 1 };
        pointManagerMock.validateCharge.mockImplementation(() => {
          throw new PointExceededError('Charge amount exceeds maximum limit');
        });
  
        await expect(service.charge(1, overLimitDto)).rejects.toThrow('Charge amount exceeds maximum limit');
      });
    it('동시에 여러 충전 요청이 들어올 때 누락되는 요청 없는지 결과 확인', async () => {
        const mockUserPoint: UserPoint = { id: 1, point: 100, updateMillis: Date.now() };
        const pointDto: PointDto = { amount: 50 };
        userDbMock.selectById.mockResolvedValue(mockUserPoint);
  
        const chargePromises = [
          service.charge(1, pointDto),
          service.charge(1, pointDto),
          service.charge(1, pointDto)
        ];
  
        await Promise.all(chargePromises);
  
        expect(pointManagerMock.add).toHaveBeenCalledTimes(3);
        expect(userDbMock.insertOrUpdate).toHaveBeenCalledTimes(3);
        expect(historyDbMock.insert).toHaveBeenCalledTimes(3);
      });
  });

  describe('use', () => {
    it('포인트를 성공적으로 사용해야 한다', async () => {
      const mockUserPoint: UserPoint = { id: 1, point: 100, updateMillis: Date.now() };
      const pointDto: PointDto = { amount: 50 };
      userDbMock.selectById.mockResolvedValue(mockUserPoint);

      const result = await service.use(1, pointDto);

      expect(result).toEqual(mockUserPoint);
      expect(pointManagerMock.validateUse).toHaveBeenCalledWith(mockUserPoint, pointDto);
      expect(pointManagerMock.use).toHaveBeenCalledWith(mockUserPoint, 50);
      expect(userDbMock.insertOrUpdate).toHaveBeenCalledWith(1, mockUserPoint.point);
      expect(historyDbMock.insert).toHaveBeenCalledWith(1, 50, TransactionType.USE, mockUserPoint.updateMillis);
    });
    it('잔액 부족 시 에러를 던져야 한다', async () => {
        const mockUserPoint: UserPoint = { id: 1, point: 30, updateMillis: Date.now() };
        const pointDto: PointDto = { amount: 50 };
        userDbMock.selectById.mockResolvedValue(mockUserPoint);
        pointManagerMock.validateUse.mockImplementation(() => {
          throw new PointNotEnoughError('Insufficient balance');
        });
  
        await expect(service.use(1, pointDto)).rejects.toThrow('Insufficient balance');
        expect(pointManagerMock.validateUse).toHaveBeenCalledWith(mockUserPoint, pointDto);
      });
    it('동일한 사용자에 대해 동시에 충전과 사용 요청이 들어올 때 누락되는 요청 없는지 결과 확인', async () => {
        const mockUserPoint: UserPoint = { id: 1, point: 100, updateMillis: Date.now() };
        userDbMock.selectById.mockResolvedValue(mockUserPoint);
  
        const chargeDto: PointDto = { amount: 50 };
        const useDto: PointDto = { amount: 30 };
  
        await Promise.all([
          service.charge(1, chargeDto),
          service.use(1, useDto)
        ]);
  
        expect(pointManagerMock.add).toHaveBeenCalledWith(mockUserPoint, 50);
        expect(pointManagerMock.use).toHaveBeenCalledWith(mockUserPoint, 30);
        expect(userDbMock.insertOrUpdate).toHaveBeenCalledTimes(2);
        expect(historyDbMock.insert).toHaveBeenCalledTimes(2);
      });

      // 동시성 제어에 대한 통합 테스트 
      it('잔고 포인트가 100이고 사용 요청이 30, 40, 35일 때 2개의 요청만 성공하고 1개는 무조건 실패해야한다', async () => {
        const initialPoint = 100;
        const mockUserPoint: UserPoint = { id: 1, point: initialPoint, updateMillis: Date.now() };
        userDbMock.selectById.mockResolvedValue(mockUserPoint);
    
        const useDto1: PointDto = { amount: 30 };
        const useDto2: PointDto = { amount: 40 };
        const useDto3: PointDto = { amount: 35 };
    
        pointManagerMock.use.mockImplementation((userPoint, amount) => {
          if (userPoint.point < amount) {
            throw new PointNotEnoughError('Insufficient balance');
          }
          userPoint.point -= amount;
          return userPoint;
        });
    
        const results = await Promise.allSettled([
          service.use(1, useDto1),
          service.use(1, useDto2),
          service.use(1, useDto3)
        ]);
    
        const successCount = results.filter(result => result.status === 'fulfilled').length;
        const failCount = results.filter(result => result.status === 'rejected').length;
    
        expect(successCount).toBe(2);
        expect(failCount).toBe(1);
      });
  });
});