import { Test, TestingModule } from '@nestjs/testing';
import { PointController } from './point.controller';
import { PointService } from '../service/point.service';
import { UserManager } from '../../common/user/user-mgr';
import { PointManager } from '../../common/point/point-mgr';
import { BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { RequestValidityError } from '../../common/exceptions/validity-error';
import { PointNotEnoughError, PointExceededError } from '../../common/exceptions/point-error';
import { UserPoint, PointHistory } from '../point.model';

describe('PointController', () => {
  let controller: PointController;
  let pointService: jest.Mocked<PointService>;
  let userManager: jest.Mocked<UserManager>;
  let pointManager: jest.Mocked<PointManager>;

  beforeEach(async () => {
    const mockPointService = {
      getPoint: jest.fn(),
      getHistories: jest.fn(),
      charge: jest.fn(),
      use: jest.fn(),
    };

    const mockUserManager = {
      validateUserId: jest.fn(),
    };

    const mockPointManager = {
      validateAmount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointController],
      providers: [
        { provide: PointService, useValue: mockPointService },
        { provide: UserManager, useValue: mockUserManager },
        { provide: PointManager, useValue: mockPointManager },
      ],
    }).compile();

    controller = module.get<PointController>(PointController);
    pointService = module.get(PointService);
    userManager = module.get(UserManager);
    pointManager = module.get(PointManager);
  });

  describe('point', () => {
    it('사용자의 포인트를 조회합니다.', async () => {
      const userId = '123';
      const userPoint = { userId, point: 100 };
      userManager.validateUserId.mockReturnValue(Number(userId));
      pointService.getPoint.mockResolvedValue(userPoint as unknown as UserPoint);

      const result = await controller.point(userId);

      expect(result).toEqual(userPoint);
      expect(userManager.validateUserId).toHaveBeenCalledWith(userId);
    });

    it('사용자 ID가 유효하지 않을 때 BadRequestException을 던져야 합니다.', async () => {
      userManager.validateUserId.mockImplementation(() => {
        throw new RequestValidityError('Invalid user ID');
      });

      await expect(controller.point('invalid')).rejects.toThrow(BadRequestException);
    });

    it('알 수 없는 에러가 발생할 때 InternalServerErrorException을 던져야 합니다.', async () => {
      userManager.validateUserId.mockImplementation(() => {
        throw new Error('Unknown error');
      });

      await expect(controller.point('123')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('history', () => {
    it('사용자의 포인트 사용 내역을 조회합니다.', async () => {
      const userId = '123';
      const histories = [{ id: 1, userId, amount: 100 }];
      userManager.validateUserId.mockReturnValue(Number(userId));
      pointService.getHistories.mockResolvedValue(histories as unknown as PointHistory[]);

      const result = await controller.history(userId);

      expect(result).toEqual(histories);
      expect(userManager.validateUserId).toHaveBeenCalledWith(userId);
      expect(pointService.getHistories).toHaveBeenCalledWith(Number(userId));
    });

  });

  describe('charge', () => {
    it('사용자의 포인트를 충전합니다.', async () => {
      const userId = '123';
      const pointBodyDto = { amount: 100 };
      const userPoint = { userId, point: 200 };
      userManager.validateUserId.mockReturnValue(Number(userId));
      pointService.charge.mockResolvedValue(userPoint as unknown as UserPoint);

      const result = await controller.charge(userId, pointBodyDto);

      expect(result).toEqual(userPoint);
      expect(userManager.validateUserId).toHaveBeenCalledWith(userId);
      expect(pointManager.validateAmount).toHaveBeenCalledWith(pointBodyDto.amount);
      expect(pointService.charge).toHaveBeenCalledWith(Number(userId), pointBodyDto);
    });

    it('포인트 한도를 초과할 때 ForbiddenException을 던져야 합니다.', async () => {
      userManager.validateUserId.mockReturnValue(123);
      pointService.charge.mockImplementation(() => {
        throw new PointExceededError('Point limit exceeded');
      });

      await expect(controller.charge('123', { amount: 1000000 })).rejects.toThrow(ForbiddenException);
    });

  });

  describe('use', () => {
    it('사용자의 포인트를 사용합니다.', async () => {
      const userId = '123';
      const pointBodyDto = { amount: 50 };
      const userPoint = { userId, point: 150 };
      userManager.validateUserId.mockReturnValue(Number(userId));
      pointService.use.mockResolvedValue(userPoint as unknown as UserPoint);

      const result = await controller.use(userId, pointBodyDto);

      expect(result).toEqual(userPoint);
      expect(pointManager.validateAmount).toHaveBeenCalledWith(pointBodyDto.amount);
      expect(pointService.use).toHaveBeenCalledWith(Number(userId), pointBodyDto);
    });

    it('포인트가 부족할 때 ForbiddenException을 던져야 합니다.', async () => {
      userManager.validateUserId.mockReturnValue(123);
      pointService.use.mockImplementation(() => {
        throw new PointNotEnoughError('Not enough points');
      });

      await expect(controller.use('123', { amount: 1000 })).rejects.toThrow(ForbiddenException);
    });

  });
});